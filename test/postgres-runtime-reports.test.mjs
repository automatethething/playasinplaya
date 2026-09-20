import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");

test("runtime report function has a fixed search path and restricted execution", () => {
  const migration = read("supabase/migrations/008_runtime_reports.sql");
  assert.match(migration, /create or replace function create_directory_report\(/);
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = public, pg_catalog/);
  assert.match(migration, /insert into public\.reports/);
  assert.doesNotMatch(migration, /execute\s+format|\|\|/i);
  assert.match(migration, /revoke all on function create_directory_report[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function create_directory_report[\s\S]*to app_runtime/);
  assert.doesNotMatch(migration, /grant (select|insert|update|delete) on reports/i);
});

test("PostgreSQL report wrapper parameterizes every function argument", () => {
  const postgres = read("src/lib/postgres.ts");
  assert.match(postgres, /select public\.create_directory_report\(\$1::uuid, \$2, \$3, \$4, \$5::timestamptz\)/);
  assert.doesNotMatch(postgres, /create_directory_report\(\$\{\s*report/);
});

test("reports route selects PostgreSQL only when configured and preserves Supabase fallback", () => {
  const route = read("src/app/api/reports/route.ts");
  assert.match(route, /hasPostgresConfig\(\)/);
  assert.match(route, /await createPreparedReport\(report\)/);
  assert.match(route, /from\("reports"\)\.insert\(report\)/);
  assert.match(route, /return unavailable\(\)/);
  assert.match(route, /return rejected\(\)/);
});
