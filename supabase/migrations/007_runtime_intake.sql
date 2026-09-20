create or replace function submit_directory_submission(
  p_item_type text,
  p_payload jsonb,
  p_normalized_url_hash text,
  p_contact_email text,
  p_contact_whatsapp text,
  p_consented_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if exists (select 1 from directory_items where normalized_url_hash = p_normalized_url_hash) then
    return;
  end if;

  insert into submissions (item_type, payload, normalized_url_hash, contact_email, contact_whatsapp, consented_at)
  values (p_item_type, p_payload, p_normalized_url_hash, p_contact_email, p_contact_whatsapp, p_consented_at)
  on conflict (normalized_url_hash) do nothing;
end;
$$;

revoke all on function submit_directory_submission(text, jsonb, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function submit_directory_submission(text, jsonb, text, text, text, timestamptz) to app_runtime;
