import { normalizeHttpsUrl } from "./validation.mjs";

export const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const verificationWindowMs = 30 * 24 * 60 * 60 * 1000;

function isSafeExternalUrl(value) {
  try {
    return Boolean(normalizeHttpsUrl(value));
  } catch {
    return false;
  }
}

function isFuture(value, now) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > now;
}

function isPublicListing(item, now) {
  return (!item.status || item.status === "active")
    && Boolean(item.published_at)
    && (!item.expires_at || new Date(item.expires_at) > now);
}

export function isPublicEvent(item, now = new Date()) {
  return item.item_type === "event"
    && isPublicListing(item, now)
    && Boolean(item.expires_at)
    && Boolean(item.last_verified_at)
    && new Date(item.last_verified_at).getTime() >= now.getTime() - verificationWindowMs
    && isFuture(item.event_starts_at, now)
    && Boolean(item.venue)
    && Boolean(item.organizer_name)
    && isSafeExternalUrl(item.source_url);
}

export function isPublicDeal(item, now = new Date()) {
  return item.item_type === "deal"
    && isPublicListing(item, now)
    && Array.isArray(item.deal_days)
    && item.deal_days.some((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    && isSafeExternalUrl(item.source_url);
}

export function normalizeDealDay(value) {
  if (value === "" || value === null || value === undefined) return null;
  const day = Number(value);
  return Number.isInteger(day) && day >= 0 && day <= 6 ? day : null;
}

export function filterDealsByDay(items, day, now = new Date()) {
  const normalizedDay = normalizeDealDay(day);
  return items.filter((item) => isPublicDeal(item, now) && (normalizedDay === null || item.deal_days.includes(normalizedDay)));
}

export function formatCancunDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Cancun",
  }).format(new Date(value));
}

export function formatDays(days) {
  return [...new Set(days)]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b)
    .map((day) => daysOfWeek[day])
    .join(", ");
}

export { isSafeExternalUrl };
