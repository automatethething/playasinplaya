import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  canTransitionDirectoryStatus,
  filterPublicDirectoryItems,
  toPublicDirectoryItem,
} from "../src/lib/directory.mjs";
import {
  hasDuplicateUrl,
  normalizedUrlHash,
  normalizeHttpsUrl,
} from "../src/lib/validation.mjs";

const sql = fs.readFileSync(path.resolve("supabase/migrations/001_directory.sql"), "utf8");
const normalizedSql = sql.replace(/\s+/g, " ").toLowerCase();

function publishable(overrides = {}) {
  return {
    approved_at: "2026-03-01T12:00:00.000Z",
    published_at: "2026-03-01T12:00:00.000Z",
    last_verified_at: "2026-03-02T12:00:00.000Z",
    ...overrides,
  };
}

test("directory migration defines the constrained moderation schema", () => {
  for (const table of ["directory_items", "submissions", "reports", "moderation_events", "opt_ins"]) {
    assert.match(normalizedSql, new RegExp(`create table ${table}`));
    assert.match(normalizedSql, new RegExp(`alter table ${table} enable row level security`));
  }

  assert.match(normalizedSql, /item_type in \('group', 'event', 'deal'\)/);
  assert.match(normalizedSql, /status in \('pending', 'active', 'needs_review', 'archived'\)/);
  assert.match(normalizedSql, /item_type <> 'group' or \(topic is not null and link_url is not null\)/);
  assert.match(normalizedSql, /item_type <> 'event' or \(event_starts_at is not null and source_url is not null\)/);
  assert.match(normalizedSql, /item_type <> 'deal' or \( business_name is not null and offer is not null/);
  assert.match(normalizedSql, /deal_days <@ array\[0, 1, 2, 3, 4, 5, 6\]::smallint\[\]/);
  assert.match(normalizedSql, /normalized_url_hash text generated always as/);
  assert.match(normalizedSql, /create unique index directory_items_normalized_url_hash_idx/);
  assert.match(normalizedSql, /create index directory_items_public_lookup_idx/);
});

test("directory migration protects public reads and private contacts", () => {
  const view = sql.match(/create view public_directory_items[\s\S]*?;\n\nrevoke all/i)?.[0] ?? "";

  assert.match(view, /with \(security_barrier = true\)/i);
  assert.match(view, /where status = 'active'\s+and published_at is not null\s+and \(expires_at is null or expires_at > now\(\)\)/i);
  for (const contact of ["organizer_contact", "contact_email", "contact_whatsapp", "payload", "details", "actor_id"]) {
    assert.doesNotMatch(view, new RegExp(`\\b${contact}\\b`, "i"));
  }

  assert.match(normalizedSql, /revoke all on directory_items, submissions, reports, moderation_events, opt_ins from public, anon, authenticated/);
  assert.match(normalizedSql, /grant select on public_directory_items to anon, authenticated/);
  assert.match(normalizedSql, /grant select, insert, update, delete on directory_items, submissions, reports, moderation_events, opt_ins to service_role/);
});

test("directory migration permits only the approved status transitions", () => {
  assert.match(normalizedSql, /if new\.status <> 'pending' then raise exception 'directory items must begin pending'/);
  assert.match(normalizedSql, /old\.status = 'pending' and new\.status in \('active', 'archived'\)/);
  assert.match(normalizedSql, /old\.status = 'active' and new\.status in \('needs_review', 'archived'\)/);
  assert.match(normalizedSql, /old\.status = 'needs_review' and new\.status in \('active', 'archived'\)/);
  assert.match(normalizedSql, /new\.last_verified_at <= old\.last_verified_at/);
});

test("public projection omits moderation and contact fields and hides inactive or expired items", () => {
  const active = {
    id: "item-1",
    item_type: "group",
    title: "Remote workers",
    link_url: "https://chat.whatsapp.com/example",
    provenance: "Curated with permission",
    verification_method: "curated",
    status: "active",
    published_at: "2026-03-01T00:00:00.000Z",
    last_verified_at: "2026-03-02T00:00:00.000Z",
    organizer_contact: "private@example.com",
    contact_email: "submitter@example.com",
    internal_note: "never public",
  };
  const now = new Date("2026-03-29T00:00:00.000Z");
  const projection = toPublicDirectoryItem(active);

  assert.equal(projection.title, "Remote workers");
  assert.equal("organizer_contact" in projection, false);
  assert.equal("contact_email" in projection, false);
  assert.equal("internal_note" in projection, false);
  assert.deepEqual(filterPublicDirectoryItems([
    active,
    { ...active, id: "item-2", status: "pending" },
    { ...active, id: "item-3", expires_at: "2026-03-28T00:00:00.000Z" },
    { ...active, id: "item-4", published_at: null },
  ], now).map((item) => item.id), ["item-1"]);
});

test("runtime status rules require approval and a newer re-verification", () => {
  assert.equal(canTransitionDirectoryStatus("pending", "active", publishable()), true);
  assert.equal(canTransitionDirectoryStatus("pending", "active", {}), false);
  assert.equal(canTransitionDirectoryStatus("active", "needs_review", {}), true);
  assert.equal(canTransitionDirectoryStatus("active", "pending", {}), false);
  assert.equal(canTransitionDirectoryStatus(
    "needs_review",
    "active",
    publishable({ last_verified_at: "2026-03-03T00:00:00.000Z" }),
    { last_verified_at: "2026-03-02T00:00:00.000Z" },
  ), true);
  assert.equal(canTransitionDirectoryStatus(
    "needs_review",
    "active",
    publishable({ last_verified_at: "2026-03-02T00:00:00.000Z" }),
    { last_verified_at: "2026-03-02T00:00:00.000Z" },
  ), false);
});

test("URL helpers canonicalize HTTPS destinations and detect duplicate hashes", () => {
  const normalized = normalizeHttpsUrl("https://EXAMPLE.com:443/groups/remote/#details");
  assert.equal(normalized, "https://example.com/groups/remote");
  assert.equal(normalizedUrlHash(normalized), createHash("sha256").update(normalized).digest("hex"));
  assert.equal(hasDuplicateUrl([{ normalized_url_hash: normalizedUrlHash(normalized) }], "https://example.com/groups/remote"), true);

  for (const invalid of ["http://example.com", "https://user@example.com", "not a url", null]) {
    assert.throws(() => normalizeHttpsUrl(invalid), /public HTTPS URL/);
  }
});
