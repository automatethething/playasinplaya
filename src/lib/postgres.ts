import "server-only";
import { Pool } from "pg";
import { postgresConfigFromEnv } from "./postgres-config.mjs";

type PublicDirectoryItem = Record<string, unknown>;
type PreparedSubmission = {
  item_type: string | null;
  payload: Record<string, unknown>;
  normalized_url_hash: string;
  contact_email: string | null;
  contact_whatsapp: string | null;
  consented_at: string | null;
};

type PreparedReport = {
  directory_item_id: string | null;
  reason: string;
  details: string | null;
  contact_email: string | null;
  consented_at: string | null;
};

type PreparedOptIn = {
  email: string;
  consented_at: string;
};

export type AdminDirectoryItem = {
  id: string;
  title: string;
  item_type: string;
  status: string;
  last_verified_at: string | null;
  organizer_contact: string | null;
};

export type AdminSubmission = {
  id: string;
  item_type: string;
  payload: Record<string, unknown>;
  contact_email: string | null;
  contact_whatsapp: string | null;
  created_at: string;
};

export type AdminReport = {
  id: string;
  directory_item_id: string;
  reason: string;
  details: string | null;
  contact_email: string | null;
  created_at: string;
};

let pool: Pool | undefined;

function databaseConfig() {
  return postgresConfigFromEnv(process.env);
}

export function hasPostgresConfig() {
  return databaseConfig() !== null;
}

export async function isPostgresHealthy() {
  if (!hasPostgresConfig()) return false;
  try {
    await postgresQuery<{ ok: number }>("select $1::int as ok", [1]);
    return true;
  } catch {
    return false;
  }
}

function getPool() {
  const config = databaseConfig();
  if (!config) throw new Error("PostgreSQL runtime env vars are missing");
  pool ??= new Pool({
    ...config,
    application_name: "playasinplaya",
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl: { rejectUnauthorized: true, ...(config.ca ? { ca: config.ca } : {}) },
  });
  return pool;
}

const publicGroupSql = `
  select id, item_type, title, description, topic, language, audience, area, link_url,
    provenance, verification_method, published_at, last_verified_at, expires_at
  from public.public_directory_items
  where item_type = $1
  order by last_verified_at desc
`;

const publicEventSql = `
  select id, item_type, title, description, event_starts_at, venue, organizer_name, area,
    source_url, provenance, last_verified_at, expires_at, published_at
  from public.public_directory_items
  where item_type = $1
  order by event_starts_at asc
`;

const publicDealSql = `
  select id, item_type, title, description, business_name, offer, deal_days, area, terms,
    source_url, provenance, last_verified_at, expires_at, published_at
  from public.public_directory_items
  where item_type = $1
  order by expires_at asc
`;

export async function postgresQuery<T extends Record<string, unknown>>(sql: string, values: unknown[] = []) {
  const result = await getPool().query<T>(sql, values);
  return result.rows;
}

async function readPublicDirectoryItems(sql: string, itemType: "group" | "event" | "deal") {
  return postgresQuery<PublicDirectoryItem>(sql, [itemType]);
}

export function readPublicGroups() {
  return readPublicDirectoryItems(publicGroupSql, "group");
}

export function readPublicEvents() {
  return readPublicDirectoryItems(publicEventSql, "event");
}

export function readPublicDeals() {
  return readPublicDirectoryItems(publicDealSql, "deal");
}

export async function submitPreparedSubmission(submission: PreparedSubmission) {
  await postgresQuery("select public.submit_directory_submission($1, $2::jsonb, $3, $4, $5, $6::timestamptz)", [
    submission.item_type,
    JSON.stringify(submission.payload),
    submission.normalized_url_hash,
    submission.contact_email,
    submission.contact_whatsapp,
    submission.consented_at,
  ]);
}

export async function createPreparedReport(report: PreparedReport) {
  await postgresQuery("select public.create_directory_report($1::uuid, $2, $3, $4, $5::timestamptz)", [
    report.directory_item_id,
    report.reason,
    report.details,
    report.contact_email,
    report.consented_at,
  ]);
}

export async function upsertPreparedOptIn(optIn: PreparedOptIn, deletionTokenHash: string) {
  await postgresQuery("select public.upsert_guide_opt_in($1, $2::timestamptz, $3)", [
    optIn.email,
    optIn.consented_at,
    deletionTokenHash,
  ]);
}

export async function unsubscribePreparedOptIn(deletionTokenHash: string) {
  await postgresQuery("select public.unsubscribe_guide_opt_in($1)", [deletionTokenHash]);
}

export async function deletePreparedOptIn(deletionTokenHash: string) {
  await postgresQuery("select public.delete_guide_opt_in($1)", [deletionTokenHash]);
}

export function readAdminDirectoryQueue() {
  return postgresQuery<AdminDirectoryItem>("select * from public.admin_directory_queue()");
}

export function readAdminSubmissionQueue() {
  return postgresQuery<AdminSubmission>("select * from public.admin_submission_queue()");
}

export function readAdminOpenReportQueue() {
  return postgresQuery<AdminReport>("select * from public.admin_open_report_queue()");
}

export async function moderateDirectoryAction(action: string, targetId: string, actorId: string, edits: Record<string, unknown>) {
  await postgresQuery("select public.moderate_directory_action($1, $2::uuid, $3, $4::jsonb)", [action, targetId, actorId, JSON.stringify(edits)]);
}
