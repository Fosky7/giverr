-- 0004_donations.sql
--
-- Module 4: donations / backing flow.
--
-- Creates the `donations` table, its RLS policies, and a trigger that keeps
-- campaigns.raised_amount and campaigns.backers_count consistent server-side so
-- the client never has to compute (and can never drift from) the source totals.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.donations (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  backer_id    uuid references auth.users (id) on delete set null,
  amount       numeric(12, 2) not null check (amount > 0),
  display_name text not null default 'Anonymous',
  message      text,
  created_at   timestamptz not null default now()
);

-- Common access patterns: list a campaign's donations (newest first) and list a
-- backer's contributions.
create index if not exists donations_campaign_id_created_at_idx
  on public.donations (campaign_id, created_at desc);

create index if not exists donations_backer_id_created_at_idx
  on public.donations (backer_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.donations enable row level security;

-- Anyone (including anonymous visitors) can back a campaign.
drop policy if exists "Anyone can insert donations" on public.donations;
create policy "Anyone can insert donations"
  on public.donations
  for insert
  to anon, authenticated
  with check (
    -- A signed-in backer may only attribute a donation to themselves; guests
    -- must leave backer_id null.
    backer_id is null
    or backer_id = auth.uid()
  );

-- Donations are publicly readable so campaign pages can show a backer list and
-- totals. (No sensitive data lives on this row.)
drop policy if exists "Donations are viewable by everyone" on public.donations;
create policy "Donations are viewable by everyone"
  on public.donations
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Trigger: keep campaign totals in sync
-- ---------------------------------------------------------------------------
-- On each new donation, bump the campaign's raised_amount and backers_count.
-- SECURITY DEFINER so the update runs with the function owner's rights,
-- allowing an anonymous backer's insert to still update the (otherwise
-- creator-owned) campaign row.
create or replace function public.handle_new_donation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.campaigns
     set raised_amount = coalesce(raised_amount, 0) + new.amount,
         backers_count = coalesce(backers_count, 0) + 1
   where id = new.campaign_id;

  return new;
end;
$$;

drop trigger if exists on_donation_created on public.donations;
create trigger on_donation_created
  after insert on public.donations
  for each row
  execute function public.handle_new_donation();
