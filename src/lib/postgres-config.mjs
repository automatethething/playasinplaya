export function postgresConfigFromEnv(env = process.env) {
  const host = env.PLAYASINPLAYA_DB_HOST;
  const port = Number(env.PLAYASINPLAYA_DB_PORT);
  const database = env.PLAYASINPLAYA_DB_NAME;
  const user = env.PLAYASINPLAYA_DB_USER;
  const password = env.PLAYASINPLAYA_DB_PASSWORD;
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !database || !user || !password) return null;
  return { host, port, database, user, password, ca: env.PLAYASINPLAYA_DB_SSL_CA };
}
