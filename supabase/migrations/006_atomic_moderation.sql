-- Retention may anonymize only actor_id on old audit rows through its existing SECURITY DEFINER job.
-- All other moderation-event mutations remain prohibited.
create or replace function reject_moderation_event_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
    and current_user = (
      select pg_get_userbyid(proowner)
      from pg_proc
      where oid = 'public.cleanup_expired_intake_data()'::regprocedure
    )
    and old.actor_id <> 'anonymized'
    and new.actor_id = 'anonymized'
    and (to_jsonb(new) - 'actor_id') = (to_jsonb(old) - 'actor_id') then
    return new;
  end if;

  raise exception 'moderation events are append-only';
end;
$$;

create or replace function moderate_directory_action(
  p_action text,
  p_target_id uuid,
  p_actor_id text,
  p_edits jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_item directory_items%rowtype;
  v_next_status text;
  v_now timestamptz := now();
begin
  if coalesce(trim(p_actor_id), '') = '' then
    raise exception 'admin actor is required';
  end if;

  if p_action = 'resolve_report' then
    update reports set resolved_at = v_now
    where id = p_target_id and resolved_at is null;
    if not found then raise exception 'open report not found'; end if;
    insert into moderation_events (report_id, action, actor_id)
    values (p_target_id, 'report_resolved', p_actor_id);
    return;
  end if;

  if p_action = 'delete_submission_contact' then
    update submissions set contact_email = null, contact_whatsapp = null, consented_at = null
    where id = p_target_id;
    if not found then raise exception 'submission not found'; end if;
    insert into moderation_events (submission_id, action, actor_id)
    values (p_target_id, 'submission_contact_deleted', p_actor_id);
    return;
  end if;

  if p_action = 'delete_report_contact' then
    update reports set contact_email = null, consented_at = null, details = null
    where id = p_target_id;
    if not found then raise exception 'report not found'; end if;
    insert into moderation_events (report_id, action, actor_id)
    values (p_target_id, 'report_contact_deleted', p_actor_id);
    return;
  end if;

  select * into v_item from directory_items where id = p_target_id for update;
  if not found then raise exception 'directory item not found'; end if;

  if p_action = 'delete_organizer_contact' then
    update directory_items set organizer_contact = null where id = v_item.id;
  elsif p_action = 'approve' then
    if v_item.status not in ('pending', 'needs_review') then raise exception 'invalid transition'; end if;
    update directory_items
    set status = 'active', approved_at = coalesce(v_item.approved_at, v_now),
        published_at = coalesce(v_item.published_at, v_now), last_verified_at = v_now
    where id = v_item.id;
  elsif p_action = 'needs_review' then
    if v_item.status <> 'active' then raise exception 'invalid transition'; end if;
    update directory_items set status = 'needs_review' where id = v_item.id;
  elsif p_action = 'archive' then
    if v_item.status not in ('pending', 'active', 'needs_review') then raise exception 'invalid transition'; end if;
    update directory_items set status = 'archived' where id = v_item.id;
  elsif p_action = 'verify' then
    if v_item.status <> 'active' then raise exception 'invalid transition'; end if;
    update directory_items set last_verified_at = v_now where id = v_item.id;
  elsif p_action = 'edit' then
    if jsonb_typeof(p_edits) <> 'object' or exists (
      select 1 from jsonb_object_keys(p_edits) as key
      where key not in ('title', 'description', 'topic', 'language', 'audience', 'area', 'provenance', 'business_name', 'offer', 'terms', 'venue', 'organizer_name')
    ) then raise exception 'invalid edit'; end if;
    update directory_items set
      title = case when p_edits ? 'title' then nullif(trim(p_edits->>'title'), '') else title end,
      description = case when p_edits ? 'description' then nullif(trim(p_edits->>'description'), '') else description end,
      topic = case when p_edits ? 'topic' then nullif(trim(p_edits->>'topic'), '') else topic end,
      language = case when p_edits ? 'language' then nullif(trim(p_edits->>'language'), '') else language end,
      audience = case when p_edits ? 'audience' then nullif(trim(p_edits->>'audience'), '') else audience end,
      area = case when p_edits ? 'area' then nullif(trim(p_edits->>'area'), '') else area end,
      provenance = case when p_edits ? 'provenance' then nullif(trim(p_edits->>'provenance'), '') else provenance end,
      business_name = case when p_edits ? 'business_name' then nullif(trim(p_edits->>'business_name'), '') else business_name end,
      offer = case when p_edits ? 'offer' then nullif(trim(p_edits->>'offer'), '') else offer end,
      terms = case when p_edits ? 'terms' then nullif(trim(p_edits->>'terms'), '') else terms end,
      venue = case when p_edits ? 'venue' then nullif(trim(p_edits->>'venue'), '') else venue end,
      organizer_name = case when p_edits ? 'organizer_name' then nullif(trim(p_edits->>'organizer_name'), '') else organizer_name end
    where id = v_item.id;
  else
    raise exception 'invalid moderation action';
  end if;

  select status into v_next_status from directory_items where id = v_item.id;
  insert into moderation_events (directory_item_id, action, previous_status, next_status, actor_id)
  values (v_item.id, p_action, v_item.status, v_next_status, p_actor_id);
end;
$$;

revoke all on function moderate_directory_action(text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function moderate_directory_action(text, uuid, text, jsonb) to service_role;
