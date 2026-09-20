"use client";

import { FormEvent, useState } from "react";
import { trackGuideEvent } from "@/components/Analytics";

const labels = { group: "Group", event: "Event", deal: "Deal" };
type Type = keyof typeof labels;
const controlStyle = { minHeight: 44 };
const checkboxStyle = { minWidth: 44, minHeight: 44, margin: 0 };
const checkboxLabelStyle = { minHeight: 44, display: "flex", alignItems: "center", gap: 8 };

export function SubmissionForm() {
  const [type, setType] = useState<Type>("group");
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackGuideEvent("submission_started");
    setStatus("Sending…");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch("/api/submissions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, contact_consent: form.get("contact_consent") === "on" }) });
    setStatus(response.ok ? "Thanks — we’ll review it before publishing." : "We could not accept that request.");
    if (response.ok) {
      trackGuideEvent("submission_created");
      event.currentTarget.reset();
    }
  }
  return <form onSubmit={submit} style={{ display: "grid", gap: 14 }} aria-describedby="submission-status">
    <label>What are you suggesting?<select name="item_type" value={type} onChange={(e) => setType(e.target.value as Type)} style={controlStyle}><option value="group">Group</option><option value="event">Event</option><option value="deal">Weekly deal</option></select></label>
    <label>Title<input name="title" required maxLength={160} style={controlStyle} /></label>
    <label>{type === "group" ? "Join link" : "Public destination"}<input name="url" type="url" inputMode="url" required placeholder="https://…" style={controlStyle} /></label>
    {type === "group" && <label>Topic<input name="topic" required style={controlStyle} /></label>}
    {type === "event" && <label>Start time<input name="event_starts_at" type="datetime-local" required style={controlStyle} /></label>}
    {type === "deal" && <><label>Business<input name="business_name" required style={controlStyle} /></label><label>Offer<input name="offer" required style={controlStyle} /></label><label>Terms<input name="terms" required style={controlStyle} /></label></>}
    <label>Description (optional)<textarea name="description" maxLength={2000} rows={4} style={controlStyle} /></label>
    <label>Source link (optional)<input name="source_url" type="url" placeholder="https://…" style={controlStyle} /></label>
    <label>Email for follow-up (optional)<input name="contact_email" type="email" style={controlStyle} /></label>
    <label>WhatsApp for follow-up (optional)<input name="contact_whatsapp" inputMode="tel" style={controlStyle} /></label>
    <label style={checkboxLabelStyle}><input name="contact_consent" type="checkbox" style={checkboxStyle} /> I consent to follow-up about this submission. Contact details are never published.</label>
    <label hidden aria-hidden="true">Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <button type="submit" style={controlStyle}>Send for review</button><p id="submission-status" role="status">{status}</p>
  </form>;
}

export function ReportForm() {
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(form.entries()), contact_consent: form.get("contact_consent") === "on" }) });
    if (response.ok) trackGuideEvent("report_created");
    setStatus(response.ok ? "Thanks — the report is queued for review. It will not automatically remove a listing." : "We could not accept that request.");
  }
  return <form onSubmit={submit} style={{ display: "grid", gap: 12 }}><label>Listing ID<input name="directory_item_id" required style={controlStyle} /></label><label>Reason<select name="reason" required style={controlStyle}><option value="spam">Spam</option><option value="defunct">Defunct</option><option value="no_admin">No admin</option><option value="excessive_promotion">Excessive promotion</option><option value="wrong_listing">Wrong listing</option></select></label><label>Details (optional)<textarea name="details" maxLength={2000} rows={3} style={controlStyle} /></label><label>Email for follow-up (optional)<input name="contact_email" type="email" style={controlStyle} /></label><label style={checkboxLabelStyle}><input name="contact_consent" type="checkbox" style={checkboxStyle} /> I consent to follow-up about this report.</label><label hidden aria-hidden="true">Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label><button type="submit" style={controlStyle}>Send report</button><p role="status">{status}</p></form>;
}

export function OptInForm() {
  const [status, setStatus] = useState("");
  const storageKey = "playasinplaya-opt-in-deletion-token";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/opt-ins", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), consent: form.get("consent") === "on" }) });
    const body = await response.json().catch(() => null);
    if (response.ok && body?.deletion_token) localStorage.setItem(storageKey, body.deletion_token);
    if (response.ok) trackGuideEvent("guide_opt_in");
    setStatus(response.ok ? "You’re on the list. This browser can also unsubscribe or delete your signup." : "We could not accept that request.");
  }
  async function manage(method: "PATCH" | "DELETE") {
    const deletion_token = localStorage.getItem(storageKey);
    if (!deletion_token) return setStatus("Sign up from this browser first to manage this opt-in.");
    const response = await fetch("/api/opt-ins", { method, headers: { "content-type": "application/json" }, body: JSON.stringify({ deletion_token }) });
    if (response.ok && method === "DELETE") localStorage.removeItem(storageKey);
    setStatus(response.ok ? (method === "DELETE" ? "Your opt-in has been deleted." : "You have been unsubscribed.") : "We could not accept that request.");
  }
  return <form onSubmit={submit} style={{ display: "grid", gap: 12 }}><label>Email<input name="email" type="email" required style={controlStyle} /></label><label style={checkboxLabelStyle}><input name="consent" type="checkbox" required style={checkboxStyle} /> I agree to receive guide updates.</label><button type="submit" style={controlStyle}>Get updates</button><button type="button" onClick={() => manage("PATCH")} style={controlStyle}>Unsubscribe this browser</button><button type="button" onClick={() => manage("DELETE")} style={controlStyle}>Delete this browser’s opt-in</button><p role="status">{status}</p></form>;
}
