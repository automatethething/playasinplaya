import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");
const route = read("src/app/api/health/route.ts");
const postgres = read("src/lib/postgres.ts");
const dockerfile = read("Dockerfile");

test("health route returns only generic PostgreSQL readiness responses", () => {
  assert.match(route, /import "server-only"/);
  assert.match(route, /const ok = await isPostgresHealthy\(\)/);
  assert.match(route, /NextResponse\.json\(\{ ok \}, \{ status: ok \? 200 : 503 \}\)/);
  assert.doesNotMatch(route, /error|message|database|host|password|console\./i);
  assert.match(postgres, /export async function isPostgresHealthy\(\)[\s\S]*if \(!hasPostgresConfig\(\)\) return false;[\s\S]*postgresQuery<\{ ok: number \}>\("select \$1::int as ok", \[1\]\)[\s\S]*catch \{[\s\S]*return false;/);
});

test("runtime container is production-only, non-root, and excludes environment files", () => {
  assert.match(dockerfile, /RUN npm run build && npm prune --omit=dev/);
  assert.match(dockerfile, /USER node/);
  assert.match(dockerfile, /EXPOSE 3000/);
  assert.match(dockerfile, /--hostname", "0\.0\.0\.0", "--port", "3000/);
  assert.match(dockerfile, /COPY --from=build --chown=node:node \/app\/content \.\/content/);
  const dockerignore = read(".dockerignore");
  assert.match(dockerignore, /^\.env$/m);
  assert.match(dockerignore, /^\.env\.\*$/m);
});
