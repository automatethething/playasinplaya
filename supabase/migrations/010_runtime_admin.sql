create or replace function admin_directory_queue()
returns table (
  id uuid,
  title text,
  item_type text,
  status text,
  last_verified_at timestamptz,
  organizer_contact text
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select di.id, di.title, di.item_type, di.status, di.last_verified_at, di.organizer_contact
  from public.directory_items di
  where di.status in ('pending', 'active', 'needs_review')
  order by di.created_at desc
  limit 100
$$;

create or replace function admin_submission_queue()
returns table (
  id uuid,
  item_type text,
  payload jsonb,
  contact_email text,
  contact_whatsapp text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select s.id, s.item_type, s.payload, s.contact_email, s.contact_whatsapp, s.created_at
  from public.submissions s
  order by s.created_at desc
  limit 100
$$;

create or replace function admin_open_report_queue()
returns table (
  id uuid,
  directory_item_id uuid,
  reason text,
  details text,
  contact_email text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select r.id, r.directory_item_id, r.reason, r.details, r.contact_email, r.created_at
  from public.reports r
  where r.resolved_at is null
  order by r.created_at desc
  limit 100
$$;

revoke all on function admin_directory_queue() from public, anon, authenticated;
revoke all on function admin_submission_queue() from public, anon, authenticated;
revoke all on function admin_open_report_queue() from public, anon, authenticated;
revoke all on function moderate_directory_action(text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function admin_directory_queue() to app_runtime;
grant execute on function admin_submission_queue() to app_runtime;
grant execute on function admin_open_report_queue() to app_runtime;
grant execute on function moderate_directory_action(text, uuid, text, jsonb) to app_runtime;
