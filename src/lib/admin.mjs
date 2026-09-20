const STATUSES = new Set(["pending", "active", "needs_review", "archived"]);

export function adminIds(value = process.env.ADMIN_USER_IDS) {
  return new Set((value || "").split(",").map((id) => id.trim()).filter(Boolean));
}

export function isAdmin(userId, configuredIds = process.env.ADMIN_USER_IDS) {
  return Boolean(userId) && adminIds(configuredIds).has(userId);
}

export function moderationUpdate(action, item, now = new Date()) {
  const timestamp = now.toISOString();
  if (!STATUSES.has(item.status)) throw new Error("Invalid item");

  if (action === "approve") {
    if (item.status !== "pending" && item.status !== "needs_review") throw new Error("Invalid transition");
    if (item.status === "needs_review" && !item.last_verified_at) throw new Error("Invalid transition");
    return {
      status: "active",
      approved_at: item.approved_at || timestamp,
      published_at: item.published_at || timestamp,
      last_verified_at: timestamp,
    };
  }
  if (action === "needs_review" && item.status === "active") return { status: "needs_review" };
  if (action === "archive" && ["pending", "active", "needs_review"].includes(item.status)) return { status: "archived" };
  if (action === "verify" && item.status === "active") return { last_verified_at: timestamp };
  throw new Error("Invalid transition");
}

export function safeEdit(input) {
  const result = {};
  for (const key of ["title", "description", "topic", "language", "audience", "area", "provenance", "business_name", "offer", "terms", "venue", "organizer_name"]) {
    if (typeof input[key] === "string") result[key] = input[key].trim().slice(0, key === "description" || key === "terms" ? 2000 : 500) || null;
  }
  return result;
}
