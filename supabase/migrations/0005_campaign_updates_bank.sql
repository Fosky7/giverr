-- 0005_campaign_updates_bank.sql
-- Module 4 · Step 2: Supporting tables for the Campaign Details page and the
-- creator management dashboard.
--
--   1. campaign_updates    – creator blog/updates feed shown on the detail page
--   2. campaign_bank_details – securely stored disbursement details
--                              (creator-only; never publicly readable)
--
-- Also adds donor-wall preference columns to public.campaigns so the detail
-- page can render (or hide) the donor wall according to the creator's choice.
--
-- Security posture
--   * campaign_updates: public SELECT only when the parent campaign is active;
--     write access restricted to the campaign's creator.
--   * campaign_bank_details: STRICT — only the creator can read/write their own
--     row. There is NO anon/public SELECT policy at all. Account numbers are
--     stored encrypted (populated by an edge function using a server-side key);
--     only a non-sensitive `account_last4` is kept for display.

-- ---------------------------------------------------------------------------
-- Prerequisites
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Donor-wall preferences on campaigns
-- ---------------------------------------------------------------------------

alter table public.campaigns
  add column if not exists donor_wall_enabled boolean not null default true,
  -- 'public'    → show donor name + amount
  -- 'amount'    → hide names, show amounts only
  -- 'anonymous' → hide donors entirely (aggregate counts only)
  add column if not exists donor_privacy text not null default 'public';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_donor_privacy_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_donor_privacy_check
      check (donor_privacy in ('public', 'amount', 'anonymous'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- campaign_updates
-- ---------------------------------------------------------------------------

create table if not exists public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  creator_id  uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  body        text not null,          -- rich text (HTML/JSON)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists campaign_updates_campaign_id_idx
  on public.campaign_updates (campaign_id);
create index if not exists campaign_updates_created_at_idx
  on public.campaign_updates (created_at desc);

drop trigger if exists campaign_updates_set_updated_at on public.campaign_updates;
create trigger campaign_updates_set_updated_at
  before update on public.campaign_updates
  for each row
  execute function public.set_updated_at();

alter table public.campaign_updates enable row level security;

-- Public may read updates that belong to an active (publicly visible) campaign.
drop policy if exists "Updates for active campaigns are viewable by everyone"
  on public.campaign_updates;
create policy "Updates for active campaigns are viewable by everyone"
  on public.campaign_updates
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.campaigns c
      where c.id = campaign_updates.campaign_id
        and c.status = 'active'
    )
  );

-- Creators can read all updates for their own campaigns (including drafts).
drop policy if exists "Creators can view their own campaign updates"
  on public.campaign_updates;
create policy "Creators can view their own campaign updates"
  on public.campaign_updates
  for select
  to authenticated
  using (auth.uid() = creator_id);

-- Creators can post updates to campaigns they own.
drop policy if exists "Creators can create updates for their campaigns"
  on public.campaign_updates;
create policy "Creators can create updates for their campaigns"
  on public.campaign_updates
  for insert
  to authenticated
  with check (
    auth.uid() = creator_id
    and exists (
      select 1
      from public.campaigns c
      where c.id = campaign_updates.campaign_id
        and c.creator_id = auth.uid()
    )
  );

-- Creators can edit their own updates.
drop policy if exists "Creators can update their own campaign updates"
  on public.campaign_updates;
create policy "Creators can update their own campaign updates"
  on public.campaign_updates
  for update
  to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Creators can delete their own updates.
drop policy if exists "Creators can delete their own campaign updates"
  on public.campaign_updates;
create policy "Creators can delete their own campaign updates"
  on public.campaign_updates
  for delete
  to authenticated
  using (auth.uid() = creator_id);

grant select on public.campaign_updates to anon;
grant select, insert, update, delete on public.campaign_updates to authenticated;

-- ---------------------------------------------------------------------------
-- campaign_bank_details (STRICT — creator-only)
-- ---------------------------------------------------------------------------

create table if not exists public.campaign_bank_details (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null unique
    references public.campaigns (id) on delete cascade,
  creator_id  uuid not null references auth.users (id) on delete cascade,
  account_holder          text not null,
  -- Full account number is encrypted server-side (edge function) — never store
  -- plaintext here. Only the last 4 digits are retained for UI display.
  account_number_encrypted text,
  account_last4            text,
  bank_name               text,
  routing_number          text,
  iban                    text,
  country                 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_bank_details_creator_id_idx
  on public.campaign_bank_details (creator_id);

drop trigger if exists campaign_bank_details_set_updated_at
  on public.campaign_bank_details;
create trigger campaign_bank_details_set_updated_at
  before update on public.campaign_bank_details
  for each row
  execute function public.set_updated_at();

alter table public.campaign_bank_details enable row level security;

-- IMPORTANT: no anon / public SELECT policy exists for this table.
-- Only the owning creator may read their own bank row.
drop policy if exists "Creators can view their own bank details"
  on public.campaign_bank_details;
create policy "Creators can view their own bank details"
  on public.campaign_bank_details
  for select
  to authenticated
  using (auth.uid() = creator_id);

drop policy if exists "Creators can insert their own bank details"
  on public.campaign_bank_details;
create policy "Creators can insert their own bank details"
  on public.campaign_bank_details
  for insert
  to authenticated
  with check (
    auth.uid() = creator_id
    and exists (
      select 1
      from public.campaigns c
      where c.id = campaign_bank_details.campaign_id
        and c.creator_id = auth.uid()
    )
  );

drop policy if exists "Creators can update their own bank details"
  on public.campaign_bank_details;
create policy "Creators can update their own bank details"
  on public.campaign_bank_details
  for update
  to authenticated
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

drop policy if exists "Creators can delete their own bank details"
  on public.campaign_bank_details;
create policy "Creators can delete their own bank details"
  on public.campaign_bank_details
  for delete
  to authenticated
  using (auth.uid() = creator_id);

-- Explicit GRANTs — note anon is deliberately NOT granted any access.
grant select, insert, update, delete on public.campaign_bank_details to authenticated;
revoke all on public.campaign_bank_details from anon;
