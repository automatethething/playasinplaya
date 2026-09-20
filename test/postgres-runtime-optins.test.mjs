import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");

const migration = read("supabase/migrations/009_runtime_optins.sql");
const postgres = read("src/lib/postgres.ts");
const route = read("src/app/api/opt-ins/route.ts");

test("opt-in runtime functions use fixed search paths and app_runtime-only execution", () => {
  for (const name of ["upsert_guide_opt_in", "unsubscribe_guide_opt_in", "delete_guide_opt_in"]) {
    assert.match(migration, new RegExp(`create or replace function ${name}\\(`));
    assert.match(migration, new RegExp(`revoke all on function ${name}\\([\\s\\S]*?from public, anon, authenticated`));
    assert.match(migration, new RegExp(`grant execute on function ${name}\\([\\s\\S]*?to app_runtime`));
  }
  assert.equal((migration.match(/security definer/g) || []).length, 3);
  assert.equal((migration.match(/set search_path = public, pg_catalog/g) || []).length, 3);
  assert.match(migration, /on conflict \(email\) do update/);
  assert.match(migration, /where deletion_token_hash = p_deletion_token_hash/);
  assert.doesNotMatch(migration, /execute\s+['"]/i);
});

test("opt-in PostgreSQL wrappers parameterize hashes and never accept raw deletion tokens", () => {
  assert.match(postgres, /upsert_guide_opt_in\(\$1, \$2::timestamptz, \$3\)/);
  assert.match(postgres, /unsubscribe_guide_opt_in\(\$1\)/);
  assert.match(postgres, /delete_guide_opt_in\(\$1\)/);
  assert.match(postgres, /upsertPreparedOptIn\(optIn: PreparedOptIn, deletionTokenHash: string\)/);
  assert.doesNotMatch(postgres, /deletion_token(?!_hash)/i);
});

test("opt-in route selects PostgreSQL when configured and preserves the Supabase fallback", () => {
  for (const name of ["upsertPreparedOptIn", "unsubscribePreparedOptIn", "deletePreparedOptIn"]) assert.match(route, new RegExp(`await ${name}\\(`));
  assert.equal((route.match(/hasPostgresConfig\(\)/g) || []).length, 3);
  assert.match(route, /const tokenHash = deletionTokenHash\(deletionToken\)/);
  assert.match(route, /const \{ deletion_token \} = await intakeBody\(request\);[\s\S]*return deletionTokenHash\(deletion_token\);/);
  assert.match(route, /db\.from\("opt_ins"\)\.upsert/);
  assert.match(route, /db\.from\("opt_ins"\)\.update/);
  assert.match(route, /db\.from\("opt_ins"\)\.delete/);
  assert.doesNotMatch(route, /console\.|logger\.|deletion_token:\s*deletion_token/);
});
