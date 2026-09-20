"use client";

import { trackGuideEvent } from "@/components/Analytics";

type GroupOpenLinkProps = { href: string };

export function GroupOpenLink({ href }: GroupOpenLinkProps) {
  return <a href={href} target="_blank" rel="noreferrer" onClick={() => trackGuideEvent("group_opened")} style={{ display: "inline-flex", minHeight: 44, alignItems: "center", borderRadius: 8, background: "#075985", color: "white", padding: "8px 14px", textDecoration: "none", fontWeight: 700 }}>Join group <span className="sr-only">(opens in a new tab)</span> ↗</a>;
}
