-- Moderation history is append-only, including contact deletions and report resolution.
create function reject_moderation_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'moderation events are append-only';
end;
$$;

create trigger moderation_events_append_only
before update or delete on moderation_events
for each row execute function reject_moderation_event_mutation();
