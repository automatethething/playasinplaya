import "server-only";
import { NextResponse } from "next/server";
import { isPostgresHealthy } from "@/lib/postgres";

export async function GET() {
  const ok = await isPostgresHealthy();
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
