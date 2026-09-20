import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isRateLimited, readBoundedJson } from "@/lib/intake";

export async function intakeBody(request: NextRequest) {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > 12_000) throw new Error("Invalid request");
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (isRateLimited(key)) throw new Error("Rate limited");
  return readBoundedJson(request.body);
}

export function accepted(body: Record<string, unknown> = { ok: true }) {
  return NextResponse.json(body, { status: 202, headers: { "cache-control": "no-store" } });
}
export function rejected() { return NextResponse.json({ ok: false, message: "We could not accept that request." }, { status: 400 }); }
export function unavailable() { return NextResponse.json({ ok: false, message: "We could not accept that request." }, { status: 503 }); }

export function serviceClient() {
  try { return getSupabaseServerClient(); } catch { return null; }
}
