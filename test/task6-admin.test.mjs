import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isAdmin, moderationUpdate, safeEdit } from "../src/lib/admin.mjs";
import { toPublicDirectoryItem } from "../src/lib/directory.mjs";

const route = fs.readFileSync("src/app/api/admin/moderation/route.ts", "utf8");
const page = fs.readFileSync("src/app/admin/page.tsx", "utf8");
const appendOnlyMigration = fs.readFileSync("supabase/migrations/005_moderation_events.sql", "utf8");
const atomicMigration = fs.readFileSync("supabase/migrations/006_atomic_moderation.sql", "utf8");
const retentionMigration = fs.readFileSync("supabase/migrations/003_intake_retention.sql", "utf8");

test("admin access denies by default and requires an explicitly configured subject", () => {
  assert.equal(isAdmin("moderator", ""), false);
  assert.equal(isAdmin(undefined, "moderator"), false);
  assert.equal(isAdmin("moderator", "moderator, other"), true);
  assert.equal(isAdmin("visitor", "moderator"), false);
});

test("moderation transitions preserve the directory state machine and verification updates", () => {
  const now = new Date("2026-03-29T12:00:00Z");
  const pending = { status: "pending", approved_at: null, published_at: null, last_verified_at: null };
  assert.deepEqual(moderationUpdate("approve", pending, now), {
    status: "active", approved_at: now.toISOString(), published_at: now.toISOString(), last_verified_at: now.toISOString(),
  });
  assert.deepEqual(moderationUpdate("needs_review", { ...pending, status: "active" }, now), { status: "needs_review" });
  assert.deepEqual(moderationUpdate("verify", { ...pending, status: "active" }, now), { last_verified_at: now.toISOString() });
  assert.throws(() => moderationUpdate("needs_review", pending, now), /Invalid transition/);
  assert.throws(() => moderationUpdate("approve", { ...pending, status: "archived" }, now), /Invalid transition/);
});

test("admin route is server-authorized and delegates each mutation to one transactional RPC", () => {
  assert.match(route, /await auth\(\)/);
  assert.match(route, /if \(!actorId \|\| !isAdmin\(actorId\)\) return failure\(\)/);
  assert.match(route, /await moderateDirectoryAction\(input\.action, input\.id, actorId, edits\)/);
  assert.match(route, /p_actor_id: actorId/);
  assert.match(route, /const edits = \(input\.action === "edit" \? safeEdit\(input\) : \{\}\) as Record<string, unknown>/);
  assert.doesNotMatch(route, /from\("moderation_events"\)/);
  assert.doesNotMatch(route, /\.update\(/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("contacts remain private to the authorized admin page and public DTO", () => {
  const publicItem = toPublicDirectoryItem({ id: "a", title: "Safe", status: "active", organizer_contact: "private", contact_email: "private" });
  assert.equal("organizer_contact" in publicItem, false);
  assert.equal("contact_email" in publicItem, false);
  assert.match(page, /if \(!isAdmin\(session\?\.user\?\.id\)\) notFound\(\)/);
  assert.match(page, /contact_email/);
  assert.match(page, /contact_whatsapp/);
});

test("moderation history remains append-only except the fixed retention anonymization", () => {
  assert.match(appendOnlyMigration, /before update or delete on moderation_events/i);
  assert.match(atomicMigration, /current_user = \([\s\S]*cleanup_expired_intake_data\(\)/);
  assert.match(atomicMigration, /new\.actor_id = 'anonymized'/);
  assert.match(atomicMigration, /\(to_jsonb\(new\) - 'actor_id'\) = \(to_jsonb\(old\) - 'actor_id'\)/);
  assert.match(retentionMigration, /update moderation_events set actor_id = 'anonymized'/);
  assert.deepEqual(safeEdit({ title: "  Better title  ", actor_id: "cannot write", status: "active" }), { title: "Better title" });
});

test("moderation RPC locks, transitions, and audits in one server-only transaction", () => {
  assert.match(atomicMigration, /create or replace function moderate_directory_action\(/);
  assert.match(atomicMigration, /security definer/);
  assert.match(atomicMigration, /for update/);
  assert.match(atomicMigration, /insert into moderation_events/);
  assert.match(atomicMigration, /revoke all on function moderate_directory_action[\s\S]*public, anon, authenticated/);
  assert.match(atomicMigration, /grant execute on function moderate_directory_action[\s\S]*to service_role/);
  assert.match(atomicMigration, /p_action = 'resolve_report'/);
  assert.match(atomicMigration, /p_action = 'verify'/);
});
