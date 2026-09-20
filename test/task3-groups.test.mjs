import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { filterGroups, groupFilterOptions, isPublicGroup, normalizeGroupFilters } from "../src/lib/groups.mjs";
import { toPublicDirectoryItem } from "../src/lib/directory.mjs";

const now = new Date("2026-03-29T00:00:00.000Z");
const activeGroup = {
  id: "group-1",
  item_type: "group",
  title: "Playa remote workers",
  topic: "Work",
  language: "English",
  audience: "Remote workers",
  area: "Centro",
  link_url: "https://chat.whatsapp.com/example",
  provenance: "Curated from a permitted public listing",
  verification_method: "curated",
  status: "active",
  published_at: "2026-03-01T00:00:00.000Z",
  last_verified_at: "2026-03-28T00:00:00.000Z",
  organizer_contact: "private@example.com",
};

test("group filters use only active, verified groups and respect every facet", () => {
  const groups = [
    activeGroup,
    { ...activeGroup, id: "group-2", topic: "Hobbies", language: "Spanish" },
    { ...activeGroup, id: "group-3", status: "needs_review" },
  ];

  assert.deepEqual(filterGroups(groups, { topic: "Work", language: "English" }, now).map((group) => group.id), ["group-1"]);
  assert.deepEqual(groupFilterOptions(groups, "topic", now), ["Hobbies", "Work"]);
});

test("groups with missing, unsafe, stale, or expired join links are not public", () => {
  assert.equal(isPublicGroup({ ...activeGroup, link_url: "" }, now), false);
  assert.equal(isPublicGroup({ ...activeGroup, link_url: "http://example.com" }, now), false);
  assert.equal(isPublicGroup({ ...activeGroup, link_url: "https://user:password@example.com" }, now), false);
  assert.equal(isPublicGroup({ ...activeGroup, link_url: "https://%" }, now), false);
  assert.equal(isPublicGroup({ ...activeGroup, last_verified_at: "2026-02-26T23:59:59.999Z" }, now), false);
  assert.equal(isPublicGroup({ ...activeGroup, last_verified_at: "2026-02-27T00:00:00.000Z" }, now), true);
  assert.equal(isPublicGroup({ ...activeGroup, expires_at: "2026-03-28T00:00:00.000Z" }, now), false);
});

test("arbitrary group filter values normalize to available options", () => {
  const groups = [activeGroup, { ...activeGroup, id: "group-2", topic: "Hobbies" }];
  const filters = normalizeGroupFilters(groups, { topic: "Invented", language: "English" }, now);
  assert.deepEqual(filters, { topic: "", language: "English", audience: "", area: "" });
  assert.deepEqual(filterGroups(groups, { topic: "Invented" }, now).map((group) => group.id), ["group-1", "group-2"]);
});

test("group cards receive only the public projection and page explains verification", () => {
  const publicGroup = toPublicDirectoryItem(activeGroup);
  assert.equal("organizer_contact" in publicGroup, false);
  assert.equal("contact_email" in publicGroup, false);

  const page = fs.readFileSync(path.resolve("src/app/groups/page.tsx"), "utf8");
  assert.match(page, /working invite page matched this listing/i);
  assert.match(page, /at least every 30 days/i);
  assert.match(page, /Report a problem/);
  const submitPage = fs.readFileSync(path.resolve("src/app/submit/page.tsx"), "utf8");
  assert.match(submitPage, /id="report-problem"/);
  assert.match(submitPage, /mailto:corrections@playasinplaya\.com/);
  const migration = fs.readFileSync(path.resolve("supabase/migrations/001_directory.sql"), "utf8");
  assert.match(migration, /item_type <> 'group' or last_verified_at >= now\(\) - interval '30 days'/);
});
