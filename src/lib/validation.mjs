import { createHash } from "node:crypto";

export function normalizeHttpsUrl(value) {
  if (typeof value !== "string") throw new Error("A public HTTPS URL is required");

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("A public HTTPS URL is required");
  }

  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new Error("A public HTTPS URL is required");
  }

  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  if (url.port === "443") url.port = "";
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export function normalizedUrlHash(value) {
  return createHash("sha256").update(normalizeHttpsUrl(value)).digest("hex");
}

export function hasDuplicateUrl(items, value) {
  const hash = normalizedUrlHash(value);
  return items.some((item) => item.normalized_url_hash === hash);
}
