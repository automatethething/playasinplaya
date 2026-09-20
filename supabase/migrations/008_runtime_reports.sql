create or replace function create_directory_report(
  p_directory_item_id uuid,
  p_reason text,
  p_details text,
  p_contact_email text,
  p_consented_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.reports (directory_item_id, reason, details, contact_email, consented_at)
  values (p_directory_item_id, p_reason, p_details, p_contact_email, p_consented_at);
end;
$$;

revoke all on function create_directory_report(uuid, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function create_directory_report(uuid, text, text, text, timestamptz) to app_runtime;
