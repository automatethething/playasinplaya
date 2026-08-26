-- Replace exampleapp_ prefix with your app namespace before use.

create table if not exists exampleapp_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exampleapp_test_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  test_area text not null,
  status text not null default 'open' check (status in ('open', 'tested')),
  deploy_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exampleapp_skill_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  evaluation_id uuid,
  original_filename text not null,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  scan_status text not null default 'pending_scan' check (scan_status in ('pending_scan', 'safe', 'flagged', 'approved', 'rejected')),
  scan_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table exampleapp_tasks enable row level security;
alter table exampleapp_test_feedback enable row level security;
alter table exampleapp_skill_uploads enable row level security;

-- Explicit grants are required for new public-schema tables on newer Supabase projects.
-- This starter uses server-side service_role access by default; add anon/authenticated grants only if the app truly needs Data API access for those roles.
grant select, insert, update, delete on exampleapp_tasks to service_role;
grant select, insert, update, delete on exampleapp_test_feedback to service_role;
grant select, insert, update, delete on exampleapp_skill_uploads to service_role;

grant usage on schema public to service_role;

-- Define app-specific policies based on your auth mapping before production use.
