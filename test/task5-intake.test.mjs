import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  MAX_BODY_BYTES,
  deletionTokenHash,
  duplicateHash,
  isRateLimited,
  newDeletionToken,
  prepareOptIn,
  prepareReport,
  prepareSubmission,
  publicUrl,
  readBoundedJson,
} from "../src/lib/intake.mjs";

const root = path.resolve("src/app/api");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");

function stream(...chunks) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
  });
}

test("intake rejects malformed, credentialed, private-network, and redirect destinations", () => {
  for (const url of [
    "http://example.com", "not a url", "https://user@example.com", "https://127.0.0.1/x",
    "https://192.168.1.1/x", "https://example.local/x", "https://[fe80::1]/x", "https://bit.ly/example",
    "https://[::ffff:0000:1]/x", "https://[::ffff:7f00:1]/x", "https://[::ffff:a00:1]/x",
    "https://[::ffff:a9fe:1]/x", "https://[::ffff:ac10:1]/x", "https://[::ffff:c0a8:1]/x",
  ]) assert.throws(() => publicUrl(url));
  assert.equal(publicUrl("https://EXAMPLE.com:443/a/#x"), "https://example.com/a");
});

test("submissions normalize duplicates and isolate optional contact behind consent", () => {
  const input = { item_type: "group", title: "Remote workers", url: "https://chat.whatsapp.com/example/", topic: "work", contact_email: "person@example.com", contact_consent: true };
  const submission = prepareSubmission(input, new Date("2026-03-29T00:00:00Z"));
  assert.equal(submission.normalized_url_hash, duplicateHash("https://chat.whatsapp.com/example"));
  assert.equal(submission.consented_at, "2026-03-29T00:00:00.000Z");
  assert.equal("contact_email" in submission.payload, false);
  assert.throws(() => prepareSubmission({ ...input, contact_consent: false }));
  assert.throws(() => prepareSubmission({ ...input, website: "bot" }));
});

test("type-specific submissions and reports are constrained and queue only", () => {
  assert.throws(() => prepareSubmission({ item_type: "event", title: "Thing", url: "https://example.com", event_starts_at: "not a date" }));
  assert.throws(() => prepareSubmission({ item_type: "deal", title: "Deal", url: "https://example.com", business_name: "A", offer: "B" }));
  const report = prepareReport({ directory_item_id: "item-1", reason: "defunct", details: "Link is gone" });
  assert.deepEqual(Object.keys(report).sort(), ["consented_at", "contact_email", "details", "directory_item_id", "reason"]);
  assert.throws(() => prepareReport({ directory_item_id: "item-1", reason: "delete" }));
});

test("streamed bodies are capped even without Content-Length and simple rate limits reject abuse", async () => {
  await assert.rejects(readBoundedJson(stream("x".repeat(MAX_BODY_BYTES + 1))));
  assert.deepEqual(await readBoundedJson(stream('{"ok":true}')), { ok: true });
  const key = `test-${Date.now()}`;
  for (let i = 0; i < 6; i++) assert.equal(isRateLimited(key, 1_000 + i), false);
  assert.equal(isRateLimited(key, 1_007), true);
});

test("submission dedupe is database-race-safe and writes stay server-side", () => {
  const migration = fs.readFileSync(path.resolve("supabase/migrations/004_intake_idempotency.sql"), "utf8");
  assert.match(migration, /submissions_normalized_url_hash_key unique \(normalized_url_hash\)/);
  assert.match(migration, /row_number\(\) over \(/);
  assert.match(migration, /set normalized_url_hash = null/);
  assert.match(migration, /add column deletion_token_hash text;/);
  assert.doesNotMatch(migration, /deletion_token_hash text not null/);
  assert.match(source("submissions/route.ts"), /from\("submissions"\)\.upsert/);
  assert.match(source("submissions/route.ts"), /ignoreDuplicates: true/);
  assert.match(source("reports/route.ts"), /from\("reports"\)\.insert/);
});

test("opt-ins use opaque deletion tokens and keep unsubscribe/delete idempotent", () => {
  const first = prepareOptIn({ email: "reader@example.com", consent: true }, new Date("2026-03-29T00:00:00Z"));
  const again = prepareOptIn({ email: "reader@example.com", consent: true }, new Date("2026-03-29T01:00:00Z"));
  assert.equal(first.email, again.email);
  const token = newDeletionToken();
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(deletionTokenHash(token), deletionTokenHash(token));
  assert.match(source("opt-ins/route.ts"), /deletion_token_hash/);
  assert.match(source("opt-ins/route.ts"), /export async function PATCH/);
  assert.match(source("opt-ins/route.ts"), /export async function DELETE/);
  assert.match(source("opt-ins/route.ts"), /\.delete\(\)/);
  assert.match(fs.readFileSync(path.resolve("src/components/SubmissionForm.tsx"), "utf8"), /Delete this browser’s opt-in/);
});

test("PostHog pageviews include only the pathname", () => {
  const analytics = fs.readFileSync(path.resolve("src/components/Analytics.tsx"), "utf8");
  assert.match(analytics, /path: location\.pathname/);
  assert.doesNotMatch(analytics, /location\.href/);
});
