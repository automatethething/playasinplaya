import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");

test("runtime submission function has a fixed search path and no broad execute grant", () => {
  const migration = read("supabase/migrations/007_runtime_intake.sql");
  assert.match(migration, /create or replace function submit_directory_submission\(/);
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = public, pg_catalog/);
  assert.match(migration, /if exists \(select 1 from directory_items where normalized_url_hash = p_normalized_url_hash\)/);
  assert.match(migration, /on conflict \(normalized_url_hash\) do nothing/);
  assert.match(migration, /revoke all on function submit_directory_submission[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function submit_directory_submission[\s\S]*to app_runtime/);
  assert.doesNotMatch(migration, /grant (select|insert|update|delete) on (directory_items|submissions)/i);
});

test("PostgreSQL submission wrapper parameterizes every function argument", () => {
  const postgres = read("src/lib/postgres.ts");
  assert.match(postgres, /import "server-only"/);
  assert.match(postgres, /select public\.submit_directory_submission\(\$1, \$2::jsonb, \$3, \$4, \$5, \$6::timestamptz\)/);
  assert.match(postgres, /JSON\.stringify\(submission\.payload\)/);
  assert.doesNotMatch(postgres, /submit_directory_submission\(\$\{\s*submission/);
});

test("submissions route selects PostgreSQL only when configured and preserves Supabase fallback", () => {
  const route = read("src/app/api/submissions/route.ts");
  assert.match(route, /hasPostgresConfig\(\)/);
  assert.match(route, /await submitPreparedSubmission\(submission\)/);
  assert.match(route, /return unavailable\(\)/);
  assert.match(route, /from\("submissions"\)\.upsert/);
  assert.match(route, /ignoreDuplicates: true/);
});
