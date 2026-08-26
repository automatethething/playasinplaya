import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.resolve('supabase/migrations');

function collectSqlFiles(dir) {
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .map((file) => path.join(dir, file));
}

function extractCreatedTables(sql) {
  const matches = [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:(\w+)\.)?(\w+)/gi)];
  return matches
    .map((match) => ({ schema: match[1] ?? 'public', table: match[2] }))
    .filter(({ schema, table }) => !['auth', 'storage'].includes(schema) && !['for', 'as', 'select'].includes(table.toLowerCase()));
}

function extractRlsEnabledTables(sql) {
  const matches = [...sql.matchAll(/alter\s+table\s+(?:(\w+)\.)?(\w+)\s+enable\s+row\s+level\s+security/gi)];
  return new Set(matches.map((match) => `${match[1] ?? 'public'}.${match[2]}`));
}

test('every created table in Supabase migrations has RLS enabled', () => {
  const sql = collectSqlFiles(migrationsDir)
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  const createdTables = extractCreatedTables(sql);
  const rlsEnabledTables = extractRlsEnabledTables(sql);
  const missing = createdTables
    .map(({ schema, table }) => `${schema}.${table}`)
    .filter((tableName) => !rlsEnabledTables.has(tableName));

  assert.deepEqual(
    [...new Set(missing)],
    [],
    `Missing RLS enable statements for: ${[...new Set(missing)].join(', ')}`,
  );
});
