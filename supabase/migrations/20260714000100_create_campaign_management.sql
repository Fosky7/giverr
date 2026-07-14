-- Campaign management foundation for Giverr.
-- Creates campaign status values, campaigns, campaign updates, indexes, updated_at triggers,
-- explicit grants, and Row Level Security policies.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'campaign_status'
  ) then
    create type public.campaign_status as enum (
      'draft',
      'submitted',
      'published',
      'paused',
      'completed',
      'rejected'
    );
  end if;
end
$$;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 140),
  slug text not null check (
    char_length(slug) between 3 and 120
    and slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  summary text not null check (char_length(btrim(summary)) between 10 and 300),
  story text not null check (char_length(btrim(story)) >= 20),
  category text not null check (char_length(btrim(category)) between 2 and 80),
  beneficiary_type text not null check (char_length(btrim(beneficiary_type)) between 2 and 80),
  goal_amount numeric(12, 2) not null check (goal_amount > 0),
  raised_amount numeric(12, 2) not null default 0 check (raised_amount >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  location text,
  status public.campaign_status not null default 'draft',
  cover_image_url text,
  evidence_urls jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_urls) = 'array'),
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_timeline_check check (starts_at is null or ends_at is null or ends_at > starts_at)
);

comment on table public.campaigns is 'Fundraising campaigns created by authenticated Giverr users.';
comment on column public.campaigns.owner_id is 'Authenticated user that owns and manages the campaign.';
comment on column public.campaigns.evidence_urls is 'JSON array of URLs for supporting documents, images, or evidence.';

create table if not exists public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 140),
  body text not null check (char_length(btrim(body)) >= 10),
  evidence_urls jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_urls) = 'array'),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.campaign_updates is 'Extensibility point for campaign progress, milestone, and impact updates.';
comment on column public.campaign_updates.is_public is 'Controls whether the update is visible with a published campaign.';

create unique index if not exists campaigns_slug_idx on public.campaigns (slug);
create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists campaigns_owner_id_idx on public.campaigns (owner_id);
create index if not exists campaigns_category_idx on public.campaigns (category);
create index if not exists campaigns_created_at_idx on public.campaigns (created_at desc);
create index if not exists campaigns_published_at_idx on public.campaigns (published_at desc) where published_at is not null;

create index if not exists campaign_updates_campaign_id_idx on public.campaign_updates (campaign_id);
create index if not exists campaign_updates_owner_id_idx on public.campaign_updates (owner_id);
create index if not exists campaign_updates_created_at_idx on public.campaign_updates (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
  before update on public.campaigns
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_campaign_updates_updated_at on public.campaign_updates;
create trigger set_campaign_updates_updated_at
  before update on public.campaign_updates
  for each row
  execute function public.set_updated_at();

alter table public.campaigns enable row level security;
alter table public.campaign_updates enable row level security;

revoke all on table public.campaigns from public;
revoke all on table public.campaign_updates from public;
revoke all on type public.campaign_status from public;

grant usage on schema public to anon, authenticated;
grant usage on type public.campaign_status to anon, authenticated;

-- Campaign reads are protected by RLS: anonymous users only see published campaigns;
-- authenticated users see published campaigns plus their own campaigns.
grant select on table public.campaigns to anon, authenticated;
grant insert (
  owner_id,
  title,
  slug,
  summary,
  story,
  category,
  beneficiary_type,
  goal_amount,
  currency,
  location,
  status,
  cover_image_url,
  evidence_urls,
  starts_at,
  ends_at
) on table public.campaigns to authenticated;
grant update (
  title,
  slug,
  summary,
  story,
  category,
  beneficiary_type,
  goal_amount,
  currency,
  location,
  status,
  cover_image_url,
  evidence_urls,
  starts_at,
  ends_at
) on table public.campaigns to authenticated;

-- Campaign updates are readable when public and attached to a published campaign;
-- owners can manage their own update records.
grant select on table public.campaign_updates to anon, authenticated;
grant insert (
  campaign_id,
  owner_id,
  title,
  body,
  evidence_urls,
  is_public
) on table public.campaign_updates to authenticated;
grant update (
  title,
  body,
  evidence_urls,
  is_public
) on table public.campaign_updates to authenticated;

drop policy if exists campaigns_select_published_anon on public.campaigns;
create policy campaigns_select_published_anon
  on public.campaigns
  for select
  to anon
  using (status = 'published'::public.campaign_status);

drop policy if exists campaigns_select_published_or_owned_authenticated on public.campaigns;
create policy campaigns_select_published_or_owned_authenticated
  on public.campaigns
  for select
  to authenticated
  using (
    status = 'published'::public.campaign_status
    or owner_id = auth.uid()
  );

drop policy if exists campaigns_insert_owned_authenticated on public.campaigns;
create policy campaigns_insert_owned_authenticated
  on public.campaigns
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and status in ('draft'::public.campaign_status, 'submitted'::public.campaign_status)
  );

drop policy if exists campaigns_update_owned_draft_or_submitted_authenticated on public.campaigns;
create policy campaigns_update_owned_draft_or_submitted_authenticated
  on public.campaigns
  for update
  to authenticated
  using (
    owner_id = auth.uid()
    and status in ('draft'::public.campaign_status, 'submitted'::public.campaign_status)
  )
  with check (
    owner_id = auth.uid()
    and status in ('draft'::public.campaign_status, 'submitted'::public.campaign_status)
  );

drop policy if exists campaign_updates_select_public_for_published_campaigns_anon on public.campaign_updates;
create policy campaign_updates_select_public_for_published_campaigns_anon
  on public.campaign_updates
  for select
  to anon
  using (
    is_public = true
    and exists (
      select 1
      from public.campaigns c
      where c.id = campaign_updates.campaign_id
        and c.status = 'published'::public.campaign_status
    )
  );

drop policy if exists campaign_updates_select_public_or_owned_authenticated on public.campaign_updates;
create policy campaign_updates_select_public_or_owned_authenticated
  on public.campaign_updates
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or (
      is_public = true
      and exists (
        select 1
        from public.campaigns c
        where c.id = campaign_updates.campaign_id
          and c.status = 'published'::public.campaign_status
      )
    )
  );

drop policy if exists campaign_updates_insert_owned_campaign_authenticated on public.campaign_updates;
create policy campaign_updates_insert_owned_campaign_authenticated
  on public.campaign_updates
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.campaigns c
      where c.id = campaign_updates.campaign_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists campaign_updates_update_owned_authenticated on public.campaign_updates;
create policy campaign_updates_update_owned_authenticated
  on public.campaign_updates
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
