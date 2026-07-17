-- 0006_campaign_media_storage.sql
--
-- Module 4 (Campaign Management) — media storage.
--
-- Creates the public `campaign-media` storage bucket used by the Create
-- Campaign wizard (Step 2: images/videos) and campaign detail pages.
--
-- Access model:
--   * PUBLIC READ  — anyone can view campaign media (campaigns are public).
--   * AUTHENTICATED WRITE — a signed-in user may only insert/update/delete
--     objects under a path they own. We namespace every object by the
--     uploader's user id as the FIRST path segment:
--         {auth.uid()}/{campaignId}/{filename}
--     RLS then checks that the leading folder equals auth.uid(), so users can
--     never write into another user's namespace.
--
-- Depends on: 0005_campaign_updates_bank.sql (campaigns / bank details tables).

-- ---------------------------------------------------------------------------
-- 1. Bucket
-- ---------------------------------------------------------------------------
-- `public = true` makes objects readable via the public URL without a signed
-- token, which is what CampaignCard / CampaignDetail expect for cover images.
insert into storage.buckets (id, name, public)
values ('campaign-media', 'campaign-media', true)
on conflict (id) do update set public = excluded.public;

-- ---------------------------------------------------------------------------
-- 2. Policies
-- ---------------------------------------------------------------------------
-- storage.objects already has RLS enabled by Supabase. We add scoped policies
-- for this bucket only. Drop-if-exists keeps the migration idempotent.

-- Public read for everything in the bucket.
drop policy if exists "campaign-media public read" on storage.objects;
create policy "campaign-media public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'campaign-media');

-- Authenticated users may upload only into their own {uid}/... namespace.
-- `storage.foldername(name)` returns the path segments as a text[]; element 1
-- is the top-level folder, which we require to equal the caller's uid.
drop policy if exists "campaign-media owner insert" on storage.objects;
create policy "campaign-media owner insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'campaign-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may update only their own objects.
drop policy if exists "campaign-media owner update" on storage.objects;
create policy "campaign-media owner update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'campaign-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'campaign-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users may delete only their own objects.
drop policy if exists "campaign-media owner delete" on storage.objects;
create policy "campaign-media owner delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'campaign-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
