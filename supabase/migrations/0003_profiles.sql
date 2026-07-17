-- Module 3: User profiles
-- Creates the public.profiles table with RLS + explicit GRANTs, an
-- auto-provisioning trigger that inserts a profile row on signup, and an
-- `avatars` Storage bucket for profile pictures.

-- ---------------------------------------------------------------------------
-- 1. profiles table
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                        uuid primary key references auth.users (id) on delete cascade,
  full_name                 text,
  email                     text,
  avatar_url                text,
  bio                       text,
  notification_preferences  jsonb not null default jsonb_build_object(
                              'marketing', true,
                              'campaignUpdates', true,
                              'donationReceipts', true
                            ),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.profiles is 'Per-user profile data, 1:1 with auth.users.';

-- ---------------------------------------------------------------------------
-- 2. updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Anyone (including anon) may read profiles for public creator/donor surfaces.
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

-- A user may insert their own profile row (id must match their auth uid).
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- A user may update only their own profile row.
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 4. Explicit GRANTs (RLS still governs row visibility)
-- ---------------------------------------------------------------------------
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Auto-provision a profile row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 6. avatars Storage bucket + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read access to avatar files.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Authenticated users may upload into a folder named after their uid.
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may update/replace files within their own folder.
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may delete files within their own folder.
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
