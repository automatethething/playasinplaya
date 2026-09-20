import { notFound } from "next/navigation";
import { AdminActions } from "@/components/AdminActions";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { hasPostgresConfig, readAdminDirectoryQueue, readAdminOpenReportQueue, readAdminSubmissionQueue } from "@/lib/postgres";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const card = { border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, marginTop: 16 };

async function readModerationQueues() {
  if (hasPostgresConfig()) {
    const [items, submissions, reports] = await Promise.all([
      readAdminDirectoryQueue(),
      readAdminSubmissionQueue(),
      readAdminOpenReportQueue(),
    ]);
    return { items, submissions, reports };
  }

  const db = getSupabaseServerClient();
  const [{ data: items }, { data: submissions }, { data: reports }] = await Promise.all([
    db.from("directory_items").select("id, title, item_type, status, last_verified_at, organizer_contact").in("status", ["pending", "active", "needs_review"]).order("created_at", { ascending: false }).limit(100),
    db.from("submissions").select("id, item_type, payload, contact_email, contact_whatsapp, created_at").order("created_at", { ascending: false }).limit(100),
    db.from("reports").select("id, directory_item_id, reason, details, contact_email, created_at").is("resolved_at", null).order("created_at", { ascending: false }).limit(100),
  ]);
  return { items: items ?? [], submissions: submissions ?? [], reports: reports ?? [] };
}

export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.id)) notFound();
  const { items, submissions, reports } = await readModerationQueues();

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
    <p style={{ textTransform: "uppercase", letterSpacing: ".12em", color: "#075985" }}>Protected moderation</p>
    <h1>Content queues</h1>
    <p>Contacts appear only in this protected workspace. Failed verification moves a listing to needs review and removes it from public reads.</p>

    <section><h2>Directory items</h2>{!items.length ? <p>No items awaiting moderation.</p> : items.map((item) => <article key={item.id} style={card}>
      <strong>{item.title}</strong><p>{item.item_type} · {item.status} · Last verified: {item.last_verified_at || "never"}</p>
      {item.organizer_contact ? <p>Organizer contact: {item.organizer_contact}</p> : null}
      <AdminActions id={item.id} status={item.status} title={item.title} organizerContact={Boolean(item.organizer_contact)} />
    </article>)}</section>

    <section><h2>Pending submissions</h2>{!submissions.length ? <p>No submissions awaiting review.</p> : submissions.map((submission) => <article key={submission.id} style={card}>
      <strong>{submission.item_type}</strong><pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(submission.payload, null, 2)}</pre>
      {submission.contact_email ? <p>Contact email: {submission.contact_email}</p> : null}{submission.contact_whatsapp ? <p>Contact WhatsApp: {submission.contact_whatsapp}</p> : null}
      <AdminActions id={submission.id} submission />
    </article>)}</section>

    <section><h2>Open reports</h2>{!reports.length ? <p>No open reports.</p> : reports.map((report) => <article key={report.id} style={card}>
      <strong>{report.reason}</strong><p>Listing: {report.directory_item_id}</p>{report.details ? <p>{report.details}</p> : null}{report.contact_email ? <p>Contact email: {report.contact_email}</p> : null}
      <AdminActions id={report.id} report />
    </article>)}</section>
  </main>;
}
