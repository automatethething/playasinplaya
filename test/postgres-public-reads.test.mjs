import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { postgresConfigFromEnv } from "../src/lib/postgres-config.mjs";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");

test("PostgreSQL public-read config requires every server-only connection value", () => {
  assert.equal(postgresConfigFromEnv({}), null);
  assert.equal(postgresConfigFromEnv({
    PLAYASINPLAYA_DB_HOST: "db.internal",
    PLAYASINPLAYA_DB_PORT: "0",
    PLAYASINPLAYA_DB_NAME: "playasinplaya",
    PLAYASINPLAYA_DB_USER: "playasinplaya_app",
    PLAYASINPLAYA_DB_PASSWORD: "not-empty",
  }), null);
  assert.deepEqual(postgresConfigFromEnv({
    PLAYASINPLAYA_DB_HOST: "db.internal",
    PLAYASINPLAYA_DB_PORT: "5432",
    PLAYASINPLAYA_DB_NAME: "playasinplaya",
    PLAYASINPLAYA_DB_USER: "playasinplaya_app",
    PLAYASINPLAYA_DB_PASSWORD: "not-empty",
  }), {
    host: "db.internal",
    port: 5432,
    database: "playasinplaya",
    user: "playasinplaya_app",
    password: "not-empty",
    ca: undefined,
  });
});

test("public reads use only the projection view with parameterized item types", () => {
  const postgres = read("src/lib/postgres.ts");
  assert.match(postgres, /from public\.public_directory_items/);
  assert.doesNotMatch(postgres, /from public\.directory_items/);
  assert.doesNotMatch(postgres, /service_role|app_provisioner|SUPABASE/i);
  assert.match(postgres, /where item_type = \$1/);
  assert.match(postgres, /postgresQuery<PublicDirectoryItem>\(sql, \[itemType\]\)/);
  assert.match(postgres, /max: 3/);
  assert.match(postgres, /idleTimeoutMillis: 10_000/);
  assert.match(postgres, /connectionTimeoutMillis: 5_000/);
  assert.match(postgres, /ssl: \{ rejectUnauthorized: true/);
  assert.doesNotMatch(postgres, /rejectUnauthorized: false/);
  assert.match(postgres, /postgresQuery<T extends Record<string, unknown>>\(sql: string, values: unknown\[\] = \[\]\)/);
  assert.match(postgres, /query<T>\(sql, values\)/);
  assert.match(read("src/lib/postgres-config.mjs"), /PLAYASINPLAYA_DB_SSL_CA/);
});

test("migrated public-read modules are server-only and no longer use Supabase runtime clients", () => {
  const exampleEnv = read(".env.example");
  for (const name of ["PLAYASINPLAYA_DB_HOST", "PLAYASINPLAYA_DB_PORT", "PLAYASINPLAYA_DB_NAME", "PLAYASINPLAYA_DB_USER", "PLAYASINPLAYA_DB_PASSWORD"]) assert.match(exampleEnv, new RegExp(`^${name}=`, "m"));
  assert.doesNotMatch(exampleEnv, /NEXT_PUBLIC_PLAYASINPLAYA_DB_/);
  for (const file of ["src/lib/groups.ts", "src/lib/listings.ts", "src/lib/postgres.ts"]) {
    const source = read(file);
    assert.match(source, /import "server-only"/);
    assert.doesNotMatch(source, /@supabase\/supabase-js|createClient|NEXT_PUBLIC_SUPABASE/);
  }
});
