import { NextRequest } from "next/server";
import { accepted, intakeBody, rejected, serviceClient, unavailable } from "@/lib/intake-route";
import { prepareSubmission } from "@/lib/intake";
import { hasPostgresConfig, submitPreparedSubmission } from "@/lib/postgres";

export async function POST(request: NextRequest) {
  let submission;
  try {
    submission = prepareSubmission(await intakeBody(request));
  } catch {
    return rejected();
  }

  if (hasPostgresConfig()) {
    try {
      await submitPreparedSubmission(submission);
      return accepted();
    } catch {
      return unavailable();
    }
  }

  try {
    const db = serviceClient();
    if (!db) return unavailable();
    const { data: published, error: publishedError } = await db
      .from("directory_items").select("id").eq("normalized_url_hash", submission.normalized_url_hash).limit(1);
    if (publishedError) return unavailable();
    if (published?.length) return accepted();
    const { error } = await db.from("submissions").upsert(submission, {
      onConflict: "normalized_url_hash",
      ignoreDuplicates: true,
    });
    return error ? unavailable() : accepted();
  } catch {
    return unavailable();
  }
}
