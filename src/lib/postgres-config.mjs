const URL_KEYS = [
  "PLAYASINPLAYA_DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL",
];

function discreteConfig(env) {
  const host = env.PLAYASINPLAYA_DB_HOST;
  const port = Number(env.PLAYASINPLAYA_DB_PORT || "5432");
  const database = env.PLAYASINPLAYA_DB_NAME;
  const user = env.PLAYASINPLAYA_DB_USER;
  const password = env.PLAYASINPLAYA_DB_PASSWORD;
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !database || !user || !password) return null;
  return { host, port, database, user, password, ca: env.PLAYASINPLAYA_DB_SSL_CA };
}

function urlConfig(raw, ca) {
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") return null;
  const host = url.hostname;
  const port = Number(url.port || "5432");
  const database = decodeURIComponent(url.pathname.replace(/^\/+/, "").split("/")[0] || "");
  const user = decodeURIComponent(url.username || "");
  const password = decodeURIComponent(url.password || "");
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !database || !user || !password) return null;
  return { host, port, database, user, password, ca };
}

export function postgresConfigFromEnv(env = process.env) {
  const discrete = discreteConfig(env);
  if (discrete) return discrete;
  for (const key of URL_KEYS) {
    const parsed = urlConfig(env[key], env.PLAYASINPLAYA_DB_SSL_CA);
    if (parsed) return parsed;
  }
  return null;
}
