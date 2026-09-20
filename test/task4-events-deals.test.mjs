import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  filterDealsByDay,
  formatCancunDateTime,
  formatDays,
  isPublicEvent,
  isSafeExternalUrl,
} from "../src/lib/listings.mjs";

const now = new Date("2026-03-29T12:00:00.000Z");
const publicFields = { status: "active", published_at: "2026-03-01T00:00:00.000Z", last_verified_at: "2026-03-28T00:00:00.000Z" };

test("events require current, sourced details and format times in America/Cancun", () => {
  const event = {
    ...publicFields,
    item_type: "event",
    event_starts_at: "2026-03-30T01:30:00.000Z",
    venue: "A public venue",
    organizer_name: "Organizer",
    source_url: "https://events.example.test/listing",
    expires_at: "2026-03-31T00:00:00.000Z",
  };
  assert.equal(isPublicEvent(event, now), true);
  assert.equal(isPublicEvent({ ...event, expires_at: null }, now), false);
  assert.equal(isPublicEvent({ ...event, expires_at: "2026-03-29T12:00:00.000Z" }, now), false);
  assert.equal(isPublicEvent({ ...event, last_verified_at: "2026-02-27T12:00:00.000Z" }, now), true);
  assert.equal(isPublicEvent({ ...event, last_verified_at: "2026-02-27T11:59:59.999Z" }, now), false);
  assert.equal(isPublicEvent({ ...event, event_starts_at: "2026-03-28T01:30:00.000Z" }, now), false);
  assert.equal(isPublicEvent({ ...event, venue: "" }, now), false);
  assert.equal(formatCancunDateTime(event.event_starts_at), new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/Cancun",
  }).format(new Date(event.event_starts_at)));
});

test("deal day filter hides expired deals and supports all days", () => {
  const monday = {
    ...publicFields,
    item_type: "deal",
    deal_days: [1],
    source_url: "https://business.example.test/deal",
    expires_at: "2026-04-01T00:00:00.000Z",
  };
  const expired = { ...monday, id: "expired", expires_at: "2026-03-01T00:00:00.000Z" };
  assert.deepEqual(filterDealsByDay([monday, expired], 1, now), [monday]);
  assert.deepEqual(filterDealsByDay([monday, expired], null, now), [monday]);
  assert.deepEqual(filterDealsByDay([monday], 5, now), []);
  assert.equal(formatDays([5, 1, 1]), "Monday, Friday");
});

test("events migration preserves group freshness and enforces event expiry", () => {
  const migration = fs.readFileSync(path.resolve("supabase/migrations/002_events_deals_details.sql"), "utf8");
  assert.match(migration, /directory_items_event_expiry_check[\s\S]*item_type <> 'event' or expires_at is not null/);
  assert.match(migration, /item_type <> 'group' or last_verified_at >= now\(\) - interval '30 days'/);
  assert.match(migration, /item_type <> 'event' or \([\s\S]*expires_at is not null[\s\S]*event_starts_at > now\(\)[\s\S]*last_verified_at >= now\(\) - interval '30 days'/);
});

test("external source links reject credentials and non-HTTPS schemes", () => {
  assert.equal(isSafeExternalUrl("https://source.example.test/event"), true);
  assert.equal(isSafeExternalUrl("https://user:pass@source.example.test/event"), false);
  assert.equal(isSafeExternalUrl("http://source.example.test/event"), false);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
});
