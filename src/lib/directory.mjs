const publicFields = [
  "id", "item_type", "title", "description", "topic", "language", "audience", "area",
  "link_url", "source_url", "provenance", "verification_method", "published_at",
  "last_verified_at", "expires_at", "event_starts_at", "timezone", "business_name", "offer",
  "deal_days", "terms",
];

export function isPublicDirectoryItem(item, now = new Date()) {
  if (item.status !== "active" || !item.published_at) return false;
  return !item.expires_at || new Date(item.expires_at) > now;
}

export function filterPublicDirectoryItems(items, now = new Date()) {
  return items.filter((item) => isPublicDirectoryItem(item, now)).map(toPublicDirectoryItem);
}

export function toPublicDirectoryItem(item) {
  return Object.fromEntries(publicFields.flatMap((field) => (
    item[field] === undefined ? [] : [[field, item[field]]]
  )));
}

export function canTransitionDirectoryStatus(previousStatus, nextStatus, item, previousItem = null) {
  if (previousStatus === nextStatus) return true;
  if (previousStatus === "pending") {
    return nextStatus === "archived" || (nextStatus === "active" && isPublishable(item));
  }
  if (previousStatus === "active") return nextStatus === "needs_review" || nextStatus === "archived";
  if (previousStatus === "needs_review") {
    return nextStatus === "archived" || (nextStatus === "active" && isPublishable(item)
      && previousItem?.last_verified_at
      && new Date(item.last_verified_at) > new Date(previousItem.last_verified_at));
  }
  return false;
}

function isPublishable(item) {
  return Boolean(item.approved_at && item.published_at && item.last_verified_at);
}
