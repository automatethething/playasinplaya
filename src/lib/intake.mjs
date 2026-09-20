import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { normalizeHttpsUrl, normalizedUrlHash } from "./validation.mjs";

export const REPORT_REASONS = new Set(["spam", "defunct", "no_admin", "excessive_promotion", "wrong_listing"]);
const TYPES = new Set(["group", "event", "deal"]);
export const MAX_BODY_BYTES = 12_000;
const MAX_TEXT = 2_000;
const windows = new Map();
const REDIRECT_HOSTS = new Set(["bit.ly", "buff.ly", "cutt.ly", "goo.gl", "is.gd", "linktr.ee", "rb.gy", "rebrand.ly", "shorturl.at", "t.co", "tinyurl.com"]);

export function publicUrl(value) {
  let url;
  try { url = new URL(normalizeHttpsUrl(value)); } catch { throw new Error("Invalid destination"); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || REDIRECT_HOSTS.has(host) || isPrivateIp(host)) {
    throw new Error("Invalid destination");
  }
  // ponytail: Intake never dereferences submitted URLs. Redirects are rejected only for known redirectors;
  // use a dedicated outbound-fetch service with pinned DNS if link previews are ever required.
  return url.toString();
}

function isPrivateIpv4(host) {
  const [a, b] = host.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19));
}

function mappedIpv4(host) {
  const parts = host.split("::");
  if (parts.length > 2) return null;
  const tail = parts.pop().split(":").filter(Boolean);
  const head = parts.length ? parts[0].split(":").filter(Boolean) : [];
  const groups = [...head, ...Array(8 - head.length - tail.length).fill("0"), ...tail];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))) return null;
  if (groups.slice(0, 5).some((group) => Number.parseInt(group, 16) !== 0) || groups[5].toLowerCase() !== "ffff") return null;
  const value = (Number.parseInt(groups[6], 16) << 16) | Number.parseInt(groups[7], 16);
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");
}

function isPrivateIp(host) {
  const version = isIP(host);
  if (version === 4) return isPrivateIpv4(host);
  if (version === 6) {
    const normalized = host.toLowerCase();
    const mapped = mappedIpv4(normalized);
    return normalized === "::" || normalized === "::1" || normalized.startsWith("fc") ||
      normalized.startsWith("fd") || /^fe[89ab][0-9a-f]:/.test(normalized) ||
      (mapped !== null && isPrivateIpv4(mapped));
  }
  return false;
}

function text(value, required = false) {
  const output = typeof value === "string" ? value.trim() : "";
  if ((required && !output) || output.length > MAX_TEXT) throw new Error("Invalid submission");
  return output || null;
}

function email(value) {
  const output = text(value);
  if (output && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(output)) throw new Error("Invalid submission");
  return output;
}

export function prepareSubmission(input, now = new Date()) {
  if (!input || typeof input !== "object" || input.website) throw new Error("Invalid submission");
  const item_type = text(input.item_type, true);
  if (!TYPES.has(item_type)) throw new Error("Invalid submission");
  const url = publicUrl(input.url);
  const contact_email = email(input.contact_email);
  const contact_whatsapp = text(input.contact_whatsapp);
  if ((contact_email || contact_whatsapp) && input.contact_consent !== true) throw new Error("Invalid submission");
  const source = text(input.source_url);
  const payload = { title: text(input.title, true), url, description: text(input.description), source_url: source ? publicUrl(source) : null };
  if (item_type === "group") payload.topic = text(input.topic, true);
  if (item_type === "event") {
    payload.event_starts_at = text(input.event_starts_at, true);
    if (Number.isNaN(Date.parse(payload.event_starts_at))) throw new Error("Invalid submission");
  }
  if (item_type === "deal") {
    payload.business_name = text(input.business_name, true);
    payload.offer = text(input.offer, true);
    payload.terms = text(input.terms, true);
  }
  return { item_type, payload, normalized_url_hash: normalizedUrlHash(url), contact_email, contact_whatsapp, consented_at: contact_email || contact_whatsapp ? now.toISOString() : null };
}

export function prepareReport(input, now = new Date()) {
  if (!input || typeof input !== "object" || input.website || !REPORT_REASONS.has(input.reason)) throw new Error("Invalid report");
  const directory_item_id = text(input.directory_item_id, true);
  const contact_email = email(input.contact_email);
  if (contact_email && input.contact_consent !== true) throw new Error("Invalid report");
  return { directory_item_id, reason: input.reason, details: text(input.details), contact_email, consented_at: contact_email ? now.toISOString() : null };
}

export function prepareOptIn(input, now = new Date()) {
  if (!input || typeof input !== "object" || input.website || input.consent !== true) throw new Error("Invalid opt-in");
  return { email: email(input.email) || (() => { throw new Error("Invalid opt-in"); })(), consented_at: now.toISOString(), unsubscribed_at: null };
}

export function newDeletionToken() { return randomBytes(32).toString("base64url"); }
export function deletionTokenHash(value) {
  const token = text(value, true);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("Invalid request");
  return createHash("sha256").update(token).digest("hex");
}

export async function readBoundedJson(body) {
  if (typeof body === "string") return parseBoundedJson(Buffer.from(body));
  if (!body || typeof body.getReader !== "function") throw new Error("Invalid request");
  const reader = body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("Invalid request");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return parseBoundedJson(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), size));
}

function parseBoundedJson(raw) {
  if (raw.byteLength > MAX_BODY_BYTES) throw new Error("Invalid request");
  try { return JSON.parse(raw.toString("utf8")); } catch { throw new Error("Invalid request"); }
}

export function isRateLimited(requestKey, now = Date.now(), limit = 6, duration = 60_000) {
  const key = createHash("sha256").update(requestKey || "anonymous").digest("hex");
  const hits = (windows.get(key) || []).filter((time) => now - time < duration);
  hits.push(now);
  windows.set(key, hits);
  return hits.length > limit;
}

export function duplicateHash(value) { return normalizedUrlHash(publicUrl(value)); }
