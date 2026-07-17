-- 0003_auth_profiles_trigger.sql
--
-- Auto-provision a profiles row for every new auth user (email OR Google),
-- with RLS + explicit GRANTs. This guarantees the app always has a profile to
-- read/update immediately after signup or first OAuth login, regardless of
-- which auth method was used.
--
-- Safe to run repeatedly (idempotent guards throughout).

-- ---------------------------------------------------------------------------
-- profiles table
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  email_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- A user can read their own profile.
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Public read of basic profile fields (needed for creator display on campaigns).
-- If you prefer stricter privacy, drop this policy.
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles
  for select
  using (true);

-- A user can update their own profile.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- A user can insert their own profile row (fallback; the trigger normally does
-- this via SECURITY DEFINER before the user ever calls insert).
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- GRANTs (RLS still applies on top of these)
-- ---------------------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;

-- ---------------------------------------------------------------------------
-- New-user trigger: create a profile row automatically
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    -- full_name from email signup metadata, or Google's name / given_name.
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'given_name'
    ),
    -- avatar from Google OAuth, if present.
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
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
-- Keep updated_at fresh on profile updates
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
