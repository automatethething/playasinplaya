import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, safeEdit } from "@/lib/admin";
import { hasPostgresConfig, moderateDirectoryAction } from "@/lib/postgres";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const failure = () => NextResponse.json({ ok: false, message: "Unable to complete request." }, { status: 400 });

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const actorId = session?.user?.id;
    if (!actorId || !isAdmin(actorId)) return failure();

    const input = await request.json();
    if (!input || typeof input !== "object" || typeof input.action !== "string" || typeof input.id !== "string") return failure();
    const edits = (input.action === "edit" ? safeEdit(input) : {}) as Record<string, unknown>;

    if (hasPostgresConfig()) {
      await moderateDirectoryAction(input.action, input.id, actorId, edits);
      return NextResponse.json({ ok: true });
    }

    const { error } = await getSupabaseServerClient().rpc("moderate_directory_action", {
      p_action: input.action,
      p_target_id: input.id,
      p_actor_id: actorId,
      p_edits: edits,
    });
    return error ? failure() : NextResponse.json({ ok: true });
  } catch {
    return failure();
  }
}
