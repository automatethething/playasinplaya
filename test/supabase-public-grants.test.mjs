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

function extractCreatedPublicTables(sql) {
  const matches = [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:(\w+)\.)?(\w+)/gi)];
  return matches
    .map((match) => ({ schema: match[1] ?? 'public', table: match[2] }))
    .filter(({ schema, table }) => schema === 'public' && !['for', 'as', 'select'].includes(table.toLowerCase()));
}

function extractGrantedTables(sql, role) {
  const escapedRole = role.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`grant\\s+.+?\\s+on\\s+(?:table\\s+)?([^;]+?)\\s+to\\s+${escapedRole}\\b`, 'gis');
  const tables = new Set();

  for (const match of sql.matchAll(regex)) {
    const objects = match[1].replace(/\n/g, ' ').split(',');
    for (const object of objects) {
      const trimmed = object.trim();
      const objectMatch = trimmed.match(/(?:(\w+)\.)?(\w+)$/);
      if (!objectMatch) continue;
      const schema = objectMatch[1] ?? 'public';
      const table = objectMatch[2];
      if (schema === 'public') {
        tables.add(`${schema}.${table}`);
      }
    }
  }

  return tables;
}

test('every created public table has an explicit service_role grant', () => {
  const sql = collectSqlFiles(migrationsDir)
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  const publicTables = extractCreatedPublicTables(sql).map(({ schema, table }) => `${schema}.${table}`);
  const serviceRoleGranted = extractGrantedTables(sql, 'service_role');
  const missing = publicTables.filter((tableName) => !serviceRoleGranted.has(tableName));

  assert.deepEqual(
    [...new Set(missing)],
    [],
    `Missing explicit service_role grants for: ${[...new Set(missing)].join(', ')}`,
  );
});
