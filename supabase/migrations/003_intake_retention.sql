-- Invoke from a protected scheduled job; no public caller can execute this function.
create or replace function cleanup_expired_intake_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Pending submissions are unapproved; delete their optional contact after 90 days.
  update submissions set contact_email = null, contact_whatsapp = null
  where created_at < now() - interval '90 days'
    and (contact_email is not null or contact_whatsapp is not null);

  -- Approved listing organizer contacts and report details are removed after 180 days.
  update directory_items set organizer_contact = null
  where approved_at is not null and approved_at < now() - interval '180 days' and organizer_contact is not null;
  update reports set contact_email = null, details = null
  where created_at < now() - interval '180 days' and (contact_email is not null or details is not null);

  -- Keep moderation counts/actions, not identifiable actor history.
  update moderation_events set actor_id = 'anonymized'
  where created_at < now() - interval '180 days' and actor_id <> 'anonymized';

  delete from opt_ins where coalesce(unsubscribed_at, created_at) < now() - interval '24 months';
end;
$$;

revoke all on function cleanup_expired_intake_data() from public, anon, authenticated;
grant execute on function cleanup_expired_intake_data() to service_role;
