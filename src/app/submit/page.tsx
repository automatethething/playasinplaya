import type { Metadata } from "next";
import { GuideNav } from "@/components/GuideNav";
import { OptInForm, ReportForm, SubmissionForm } from "@/components/SubmissionForm";

export const metadata: Metadata = { title: "Suggest a listing or correction", alternates: { canonical: "/submit" } };

export default function SubmitPage() {
  return <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
    <GuideNav currentPath="/submit" />
    <p style={{ color: "#075985", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Playas in Playa</p>
    <h1>Suggest a listing or correction</h1>
    <p style={{ color: "#475569", lineHeight: 1.5 }}>Every suggestion is manually reviewed before it appears in the guide. We do not publish contact details.</p>
    <p><a className="touch-link" href="mailto:corrections@playasinplaya.com">Email corrections@playasinplaya.com</a></p>
    <section><h2>Suggest a group, event, or deal</h2><SubmissionForm /></section>
    <section id="report-problem" style={{ marginTop: 40, borderTop: "1px solid #cbd5e1", paddingTop: 24 }}><h2>Report a group problem</h2><p>Reports are queued for review and never automatically remove a group.</p><ReportForm /></section>
    <section style={{ marginTop: 40, borderTop: "1px solid #cbd5e1", paddingTop: 24 }}><h2>Get occasional guide updates</h2><OptInForm /></section>
  </main>;
}
