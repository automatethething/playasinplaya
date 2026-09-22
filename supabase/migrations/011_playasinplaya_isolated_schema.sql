-- Playas in Playa owns this schema. Do not alter or grant access to unrelated public tables.
create schema if not exists playasinplaya;
create extension if not exists pgcrypto;

create table if not exists playasinplaya.directory_items (
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
  venue text,
  organizer_name text,
  timezone text not null default 'America/Cancun' check (timezone = 'America/Cancun'),
  business_name text,
  offer text,
  deal_days smallint[],
  terms text,
  organizer_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (item_type <> 'group' or (topic is not null and link_url is not null)),
  check (item_type <> 'event' or (event_starts_at is not null and source_url is not null)),
  check (item_type <> 'deal' or (business_name is not null and offer is not null and deal_days is not null and cardinality(deal_days) > 0 and deal_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[] and terms is not null and expires_at is not null)),
  check (status <> 'active' or (approved_at is not null and published_at is not null and last_verified_at is not null))
);

create table if not exists playasinplaya.submissions (
  id uuid primary key default gen_random_uuid(), item_type text not null, payload jsonb not null,
  normalized_url_hash text, contact_email text, contact_whatsapp text, consented_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists playasinplaya.reports (
  id uuid primary key default gen_random_uuid(), directory_item_id uuid not null references playasinplaya.directory_items(id),
  reason text not null, details text, contact_email text, consented_at timestamptz, resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists playasinplaya.moderation_events (
  id uuid primary key default gen_random_uuid(), directory_item_id uuid references playasinplaya.directory_items(id),
  submission_id uuid references playasinplaya.submissions(id), report_id uuid references playasinplaya.reports(id),
  action text not null, previous_status text, next_status text, actor_id text not null, created_at timestamptz not null default now()
);
create table if not exists playasinplaya.opt_ins (
  id uuid primary key default gen_random_uuid(), email text not null unique, consented_at timestamptz not null,
  unsubscribed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists playasinplaya_directory_public_idx on playasinplaya.directory_items (item_type, status, expires_at);
create unique index if not exists playasinplaya_directory_url_idx on playasinplaya.directory_items (normalized_url_hash);
create view playasinplaya.public_directory_items with (security_barrier = true) as
select id, item_type, title, description, topic, language, audience, area, link_url, source_url, provenance,
  verification_method, published_at, last_verified_at, expires_at, event_starts_at, venue, organizer_name, timezone, business_name, offer, deal_days, terms
from playasinplaya.directory_items
where status = 'active' and published_at is not null and (expires_at is null or expires_at > now())
  and (item_type <> 'group' or last_verified_at >= now() - interval '30 days');

alter table playasinplaya.directory_items enable row level security;
alter table playasinplaya.submissions enable row level security;
alter table playasinplaya.reports enable row level security;
alter table playasinplaya.moderation_events enable row level security;
alter table playasinplaya.opt_ins enable row level security;
revoke all on schema playasinplaya from public, anon, authenticated;
revoke all on all tables in schema playasinplaya from public, anon, authenticated;
revoke all on playasinplaya.public_directory_items from public, anon, authenticated;
grant usage on schema playasinplaya to app_runtime;
grant select on playasinplaya.public_directory_items to app_runtime;
grant select, insert, update, delete on all tables in schema playasinplaya to app_runtime;
