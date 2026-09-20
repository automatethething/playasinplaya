alter table directory_items
  add column venue text,
  add column organizer_name text;

alter table directory_items
  add constraint directory_items_event_details_check check (
    item_type <> 'event' or (venue is not null and organizer_name is not null)
  ),
  add constraint directory_items_event_expiry_check check (
    item_type <> 'event' or expires_at is not null
  );

create or replace view public_directory_items
with (security_barrier = true)
as
select
  id, item_type, title, description, topic, language, audience, area, link_url,
  source_url, provenance, verification_method, published_at, last_verified_at,
  expires_at, event_starts_at, timezone, business_name, offer, deal_days, terms,
  venue, organizer_name
from directory_items
where status = 'active'
  and published_at is not null
  and (expires_at is null or expires_at > now())
  and (item_type <> 'group' or last_verified_at >= now() - interval '30 days')
  and (item_type <> 'event' or (
    expires_at is not null
    and event_starts_at > now()
    and last_verified_at >= now() - interval '30 days'
  ));
