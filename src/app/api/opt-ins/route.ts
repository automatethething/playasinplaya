import { NextRequest } from "next/server";
import { accepted, intakeBody, rejected, serviceClient, unavailable } from "@/lib/intake-route";
import { deletionTokenHash, newDeletionToken, prepareOptIn } from "@/lib/intake";
import { deletePreparedOptIn, hasPostgresConfig, unsubscribePreparedOptIn, upsertPreparedOptIn } from "@/lib/postgres";

export async function POST(request: NextRequest) {
  let optIn;
  try {
    optIn = prepareOptIn(await intakeBody(request));
  } catch {
    return rejected();
  }

  const deletionToken = newDeletionToken();
  const tokenHash = deletionTokenHash(deletionToken);
  if (hasPostgresConfig()) {
    try {
      await upsertPreparedOptIn(optIn, tokenHash);
      return accepted({ ok: true, deletion_token: deletionToken });
    } catch {
      return unavailable();
    }
  }

  try {
    const db = serviceClient();
    if (!db) return unavailable();
    const { error } = await db.from("opt_ins").upsert({ ...optIn, deletion_token_hash: tokenHash }, { onConflict: "email" });
    return error ? unavailable() : accepted({ ok: true, deletion_token: deletionToken });
  } catch {
    return unavailable();
  }
}

async function tokenHashFrom(request: NextRequest) {
  const { deletion_token } = await intakeBody(request);
  return deletionTokenHash(deletion_token);
}

export async function PATCH(request: NextRequest) {
  try {
    const tokenHash = await tokenHashFrom(request);
    if (hasPostgresConfig()) {
      try {
        await unsubscribePreparedOptIn(tokenHash);
      } catch {
        return unavailable();
      }
    } else {
      const db = serviceClient();
      if (!db) return unavailable();
      const { error } = await db.from("opt_ins").update({ unsubscribed_at: new Date().toISOString() }).eq("deletion_token_hash", tokenHash);
      if (error) return unavailable();
    }
    return accepted();
  } catch {
    return rejected();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tokenHash = await tokenHashFrom(request);
    if (hasPostgresConfig()) {
      try {
        await deletePreparedOptIn(tokenHash);
      } catch {
        return unavailable();
      }
    } else {
      const db = serviceClient();
      if (!db) return unavailable();
      const { error } = await db.from("opt_ins").delete().eq("deletion_token_hash", tokenHash);
      if (error) return unavailable();
    }
    return accepted();
  } catch {
    return rejected();
  }
}
