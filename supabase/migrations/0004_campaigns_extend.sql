-- 0004_campaigns_extend.sql
--
-- Module 4: Campaign Management. Extends the existing `campaigns` table with the
-- fields the multi-step Create Campaign wizard and the public detail page need,
-- and adds two supporting tables:
--   * campaign_updates      — the creator's updates/blog feed for a campaign
--   * campaign_bank_details — WHERE funds are disbursed (sensitive, locked down)
--
-- It also provisions a public storage bucket for campaign media
-- (cover images / gallery / video posters).
--
-- RLS is enabled on every new table with explicit GRANTs so the anon/authenticated
-- roles can exercise exactly the policies below and nothing more.

-- ---------------------------------------------------------------------------
-- 1. Extend the campaigns table.
-- ---------------------------------------------------------------------------
-- These columns are additive and nullable / defaulted so existing rows remain
-- valid. `status` drives the My Campaigns dashboard (draft/active/funded/expired).

alter table public.campaigns
  add column if not exists target_audience   text,
  add column if not exists story             text,
  add column if not exists currency          text        not null default 'USD',
  add column if not exists deadline          timestamptz,
  add column if not exists status            text        not null default 'draft',
  add column if not exists cover_image_url   text,
  add column if not exists media_urls        text[]      not null default '{}',
  add column if not exists donor_wall_enabled boolean     not null default true;

-- Constrain status to the known lifecycle values.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_status_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_status_check
      check (status in ('draft', 'active', 'funded', 'expired', 'closed'));
  end if;
end $$;

create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists campaigns_creator_idx on public.campaigns (creator_id);

-- ---------------------------------------------------------------------------
-- 2. campaign_updates — creator posts / blog feed.
-- ---------------------------------------------------------------------------
create table if not exists public.campaign_updates (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  author_id   uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists campaign_updates_campaign_idx
  on public.campaign_updates (campaign_id, created_at desc);

alter table public.campaign_updates enable row level security;

-- Anyone may read updates (they appear on the public detail page).
drop policy if exists "campaign_updates_select_public" on public.campaign_updates;
create policy "campaign_updates_select_public"
  on public.campaign_updates
  for select
  using (true);

-- Only the campaign's creator may post an update, and the author must be them.
drop policy if exists "campaign_updates_insert_owner" on public.campaign_updates;
create policy "campaign_updates_insert_owner"
  on public.campaign_updates
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.campaigns c
      where c.id = campaign_id and c.creator_id = auth.uid()
    )
  );

-- The author may edit / delete their own updates.
drop policy if exists "campaign_updates_update_owner" on public.campaign_updates;
create policy "campaign_updates_update_owner"
  on public.campaign_updates
  for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "campaign_updates_delete_owner" on public.campaign_updates;
create policy "campaign_updates_delete_owner"
  on public.campaign_updates
  for delete
  to authenticated
  using (author_id = auth.uid());

grant select on public.campaign_updates to anon, authenticated;
grant insert, update, delete on public.campaign_updates to authenticated;

-- ---------------------------------------------------------------------------
-- 3. campaign_bank_details — sensitive disbursement info.
-- ---------------------------------------------------------------------------
-- One row per campaign. Only the owning creator may read/write, and account
-- numbers are written through the `save-bank-details` edge function (which uses
-- the service role) so the raw value never has to be exposed to the anon key.
create table if not exists public.campaign_bank_details (
  campaign_id         uuid primary key references public.campaigns (id) on delete cascade,
  creator_id          uuid not null references auth.users (id) on delete cascade,
  account_holder_name text not null,
  bank_name           text not null,
  -- Store only the last 4 digits in the clear for display; the full number is
  -- kept encrypted by the edge function.
  account_last4       text,
  account_number_enc  text,
  routing_number      text,
  swift_bic           text,
  country             text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.campaign_bank_details enable row level security;

-- Only the owner can read their own bank details. No public policy at all.
drop policy if exists "bank_details_select_owner" on public.campaign_bank_details;
create policy "bank_details_select_owner"
  on public.campaign_bank_details
  for select
  to authenticated
  using (creator_id = auth.uid());

-- Writes go through the edge function (service role bypasses RLS). We still add
-- an owner-scoped insert/update policy so a well-formed authenticated write is
-- allowed if ever performed directly.
drop policy if exists "bank_details_insert_owner" on public.campaign_bank_details;
create policy "bank_details_insert_owner"
  on public.campaign_bank_details
  for insert
  to authenticated
  with check (creator_id = auth.uid());

drop policy if exists "bank_details_update_owner" on public.campaign_bank_details;
create policy "bank_details_update_owner"
  on public.campaign_bank_details
  for update
  to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- Deliberately grant SELECT only to authenticated (never anon) — the number
-- columns must never be reachable via the public key.
grant select, insert, update on public.campaign_bank_details to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Storage bucket for campaign media.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('campaign-media', 'campaign-media', true)
on conflict (id) do nothing;

-- Public read of campaign media.
drop policy if exists "campaign_media_read" on storage.objects;
create policy "campaign_media_read"
  on storage.objects
  for select
  using (bucket_id = 'campaign-media');

-- Authenticated users may upload into a folder namespaced by their user id
-- (path convention: `${auth.uid()}/...`).
drop policy if exists "campaign_media_insert_owner" on storage.objects;
create policy "campaign_media_insert_owner"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'campaign-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "campaign_media_update_owner" on storage.objects;
create policy "campaign_media_update_owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'campaign-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "campaign_media_delete_owner" on storage.objects;
create policy "campaign_media_delete_owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'campaign-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
