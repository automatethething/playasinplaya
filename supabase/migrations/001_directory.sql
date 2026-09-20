create extension if not exists pgcrypto;

create table directory_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('group', 'event', 'deal')),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  topic text,
  language text,
  audience text,
  area text,
  link_url text,
  normalized_url text not null check (normalized_url ~ '^https://'),
  normalized_url_hash text generated always as (encode(digest(normalized_url, 'sha256'), 'hex')) stored,
  source_url text,
  provenance text not null check (char_length(trim(provenance)) between 1 and 500),
  verification_method text not null check (verification_method in ('curated', 'community_submitted')),
  status text not null default 'pending' check (status in ('pending', 'active', 'needs_review', 'archived')),
  approved_at timestamptz,
  published_at timestamptz,
  last_verified_at timestamptz,
  expires_at timestamptz,
  event_starts_at timestamptz,
  timezone text not null default 'America/Cancun' check (timezone in ('America/Cancun')),
  business_name text,
  offer text,
  deal_days smallint[],
  terms text,
  organizer_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (item_type <> 'group' or (topic is not null and link_url is not null)),
  check (item_type <> 'event' or (event_starts_at is not null and source_url is not null)),
  check (item_type <> 'deal' or (
    business_name is not null and offer is not null and deal_days is not null and cardinality(deal_days) > 0
    and deal_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[] and terms is not null and expires_at is not null
  )),
  check (status <> 'active' or (approved_at is not null and published_at is not null and last_verified_at is not null)),
  check (expires_at is null or expires_at > created_at)
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('group', 'event', 'deal')),
  payload jsonb not null,
  normalized_url_hash text,
  contact_email text,
  contact_whatsapp text,
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  check (contact_email is null and contact_whatsapp is null or consented_at is not null)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  directory_item_id uuid not null references directory_items(id),
  reason text not null check (reason in ('spam', 'defunct', 'no_admin', 'excessive_promotion', 'wrong_listing')),
  details text,
  contact_email text,
  consented_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (contact_email is null or consented_at is not null)
);

create table moderation_events (
  id uuid primary key default gen_random_uuid(),
  directory_item_id uuid references directory_items(id),
  submission_id uuid references submissions(id),
  report_id uuid references reports(id),
  action text not null,
  previous_status text check (previous_status is null or previous_status in ('pending', 'active', 'needs_review', 'archived')),
  next_status text check (next_status is null or next_status in ('pending', 'active', 'needs_review', 'archived')),
  actor_id text not null,
  created_at timestamptz not null default now()
);

create table opt_ins (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  consented_at timestamptz not null,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email)
);

create index directory_items_public_lookup_idx on directory_items (item_type, status, expires_at);
create unique index directory_items_normalized_url_hash_idx on directory_items (normalized_url_hash);
create index directory_items_verification_idx on directory_items (last_verified_at) where status = 'active';
create index submissions_normalized_url_hash_idx on submissions (normalized_url_hash) where normalized_url_hash is not null;
create index reports_open_idx on reports (created_at) where resolved_at is null;

create function enforce_directory_item_transition()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending' then
      raise exception 'directory items must begin pending';
    end if;
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if old.status = 'pending' and new.status in ('active', 'archived') then
    if new.status = 'active' and (new.approved_at is null or new.published_at is null or new.last_verified_at is null) then
      raise exception 'pending items require approval, publication, and verification before activation';
    end if;
    return new;
  end if;

  if old.status = 'active' and new.status in ('needs_review', 'archived') then
    return new;
  end if;

  if old.status = 'needs_review' and new.status in ('active', 'archived') then
    if new.status = 'active' and (
      new.approved_at is null or new.published_at is null or new.last_verified_at is null
      or new.last_verified_at <= old.last_verified_at
    ) then
      raise exception 'needs_review items require a newer verification before activation';
    end if;
    return new;
  end if;

  raise exception 'invalid directory item status transition: % to %', old.status, new.status;
end;
$$;

create trigger directory_items_transition_guard
before insert or update on directory_items
for each row execute function enforce_directory_item_transition();

alter table directory_items enable row level security;
alter table submissions enable row level security;
alter table reports enable row level security;
alter table moderation_events enable row level security;
alter table opt_ins enable row level security;

-- Public callers can only read this projection, never the base table or contact fields.
create view public_directory_items
with (security_barrier = true)
as
select
  id, item_type, title, description, topic, language, audience, area, link_url,
  source_url, provenance, verification_method, published_at, last_verified_at,
  expires_at, event_starts_at, timezone, business_name, offer, deal_days, terms
from directory_items
where status = 'active'
  and published_at is not null
  and (expires_at is null or expires_at > now())
  and (item_type <> 'group' or last_verified_at >= now() - interval '30 days');

revoke all on directory_items, submissions, reports, moderation_events, opt_ins from public, anon, authenticated;
revoke all on public_directory_items from public, anon, authenticated;
grant select on public_directory_items to anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on directory_items, submissions, reports, moderation_events, opt_ins to service_role;
