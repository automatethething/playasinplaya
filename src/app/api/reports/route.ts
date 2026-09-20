import { NextRequest } from "next/server";
import { accepted, intakeBody, rejected, serviceClient, unavailable } from "@/lib/intake-route";
import { prepareReport } from "@/lib/intake";
import { createPreparedReport, hasPostgresConfig } from "@/lib/postgres";

export async function POST(request: NextRequest) {
  let report;
  try {
    report = prepareReport(await intakeBody(request));
  } catch {
    return rejected();
  }

  if (hasPostgresConfig()) {
    try {
      await createPreparedReport(report);
      return accepted();
    } catch {
      return unavailable();
    }
  }

  try {
    const db = serviceClient();
    if (!db) return unavailable();
    // Reports enter the review queue; they never mutate or remove the listing here.
    const { error } = await db.from("reports").insert(report);
    return error ? unavailable() : accepted();
  } catch {
    return unavailable();
  }
}
