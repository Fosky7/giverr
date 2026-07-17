-- Module 3, Step 2b: Storage bucket for profile avatars
--
-- Creates a public-read `avatars` bucket. Public read allows avatar images to
-- render anywhere without signed URLs. Writes (insert/update/delete) are
-- restricted to authenticated users, and only within a top-level folder
-- matching their own auth uid (e.g. `<uid>/avatar.png`).

-- Create the bucket (idempotent).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- -------------------------------------------------------------------------
-- Policies on storage.objects for the `avatars` bucket
-- -------------------------------------------------------------------------

-- Public read of any avatar object.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload into their own uid folder.
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update objects in their own uid folder.
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete objects in their own uid folder.
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
