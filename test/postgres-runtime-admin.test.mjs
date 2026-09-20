import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");
const migration = read("supabase/migrations/010_runtime_admin.sql");
const postgres = read("src/lib/postgres.ts");
const route = read("src/app/api/admin/moderation/route.ts");
const page = read("src/app/admin/page.tsx");

test("admin PostgreSQL functions expose only required queue fields and app_runtime execution", () => {
  for (const name of ["admin_directory_queue", "admin_submission_queue", "admin_open_report_queue"]) {
    assert.match(migration, new RegExp(`create or replace function ${name}\\(\\)`));
    assert.match(migration, new RegExp(`revoke all on function ${name}\\(\\)[\\s\\S]*?from public, anon, authenticated`));
    assert.match(migration, new RegExp(`grant execute on function ${name}\\(\\)[\\s\\S]*?to app_runtime`));
  }
  assert.equal((migration.match(/security definer/g) || []).length, 3);
  assert.equal((migration.match(/set search_path = public, pg_catalog/g) || []).length, 3);
  assert.match(migration, /where di\.status in \('pending', 'active', 'needs_review'\)/);
  assert.match(migration, /where r\.resolved_at is null/);
  for (const column of ["di.id", "s.id", "r.id"]) assert.match(migration, new RegExp(`select ${column}`));
  assert.match(migration, /limit 100/);
  assert.match(migration, /grant execute on function moderate_directory_action\(text, uuid, text, jsonb\) to app_runtime/);
  assert.doesNotMatch(migration, /execute\s+['"]/i);
});

test("admin PostgreSQL wrappers and route remain server-only, parameterized, and authorized before database use", () => {
  assert.match(postgres, /import "server-only"/);
  for (const name of ["readAdminDirectoryQueue", "readAdminSubmissionQueue", "readAdminOpenReportQueue", "moderateDirectoryAction"]) assert.match(postgres, new RegExp(`export (async )?function ${name}`));
  assert.match(postgres, /moderate_directory_action\(\$1, \$2::uuid, \$3, \$4::jsonb\)/);
  assert.match(postgres, /JSON\.stringify\(edits\)/);
  assert.doesNotMatch(postgres, /app_provisioner|service_role|SUPABASE/i);
  assert.match(route, /const session = await auth\(\);[\s\S]*if \(!actorId \|\| !isAdmin\(actorId\)\) return failure\(\);[\s\S]*const input = await request\.json\(\);[\s\S]*if \(hasPostgresConfig\(\)\)/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY|PLAYASINPLAYA_DB_PASSWORD/);
  assert.match(page, /const session = await auth\(\);[\s\S]*if \(!isAdmin\(session\?\.user\?\.id\)\) notFound\(\);[\s\S]*const \{ items, submissions, reports \} = await readModerationQueues\(\);/);
  assert.match(page, /if \(hasPostgresConfig\(\)\)/);
});
