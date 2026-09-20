"use client";

import { useState } from "react";

type Props = { id: string; status?: string; title?: string; organizerContact?: boolean; report?: boolean; submission?: boolean };

export function AdminActions({ id, status, title = "", organizerContact, report, submission }: Props) {
  const [message, setMessage] = useState("");
  const [editedTitle, setEditedTitle] = useState(title);
  async function mutate(action: string, extra = {}) {
    setMessage("");
    const response = await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    setMessage(response.ok ? "Saved. Refresh to update the queue." : "Unable to complete request.");
  }
  if (report) return <div><button type="button" onClick={() => mutate("resolve_report")}>Resolve report</button><button type="button" onClick={() => mutate("delete_report_contact")}>Delete contact/details</button>{message && <p role="status">{message}</p>}</div>;
  if (submission) return <div><button type="button" onClick={() => mutate("delete_submission_contact")}>Delete contact</button>{message && <p role="status">{message}</p>}</div>;
  return <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {status === "pending" || status === "needs_review" ? <button type="button" onClick={() => mutate("approve")}>Approve and verify</button> : null}
    {status === "active" ? <><button type="button" onClick={() => mutate("verify")}>Update verification date</button><button type="button" onClick={() => mutate("needs_review")}>Needs review</button></> : null}
    {status !== "archived" ? <button type="button" onClick={() => mutate("archive")}>Archive</button> : null}
    {organizerContact ? <button type="button" onClick={() => mutate("delete_organizer_contact")}>Delete organizer contact</button> : null}
    <label>Edit title <input value={editedTitle} onChange={(event) => setEditedTitle(event.target.value)} /></label>
    <button type="button" onClick={() => mutate("edit", { title: editedTitle })}>Save edit</button>
    {message && <p role="status">{message}</p>}
  </div>;
}
