import { normalizeHttpsUrl } from "./validation.mjs";

const filterFields = ["topic", "language", "audience", "area"];
const verificationWindowMs = 30 * 24 * 60 * 60 * 1000;

function hasSafeJoinLink(value) {
  try {
    normalizeHttpsUrl(value);
    return true;
  } catch {
    return false;
  }
}

export function isPublicGroup(item, now = new Date()) {
  return item.item_type === "group"
    && (!item.status || item.status === "active")
    && Boolean(item.published_at)
    && Boolean(item.last_verified_at)
    && new Date(item.last_verified_at).getTime() >= now.getTime() - verificationWindowMs
    && hasSafeJoinLink(item.link_url)
    && (!item.expires_at || new Date(item.expires_at) > now);
}

function publicGroups(items, now) {
  return items.filter((item) => isPublicGroup(item, now));
}

export function groupFilterOptions(items, field, now = new Date()) {
  return [...new Set(publicGroups(items, now).map((item) => item[field]).filter(Boolean))].sort();
}

export function normalizeGroupFilters(items, filters = {}, now = new Date()) {
  return Object.fromEntries(filterFields.map((field) => {
    const value = typeof filters[field] === "string" ? filters[field] : "";
    return [field, groupFilterOptions(items, field, now).includes(value) ? value : ""];
  }));
}

export function filterGroups(items, filters = {}, now = new Date()) {
  const normalizedFilters = normalizeGroupFilters(items, filters, now);
  return publicGroups(items, now).filter((item) => filterFields.every((field) => (
    !normalizedFilters[field] || item[field] === normalizedFilters[field]
  )));
}
