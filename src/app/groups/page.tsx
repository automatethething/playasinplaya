import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { GroupOpenLink } from "@/components/GroupOpenLink";
import { GuideNav } from "@/components/GuideNav";
import { filterGroups, getPublicGroups, groupFilterOptions, normalizeGroupFilters } from "@/lib/groups";

export const metadata: Metadata = {
  title: "Verified WhatsApp groups",
  description: "Find moderated Playa del Carmen WhatsApp groups by topic, language, audience, and area.",
  alternates: { canonical: "/groups" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type FilterName = "topic" | "language" | "audience" | "area";
const filterNames: FilterName[] = ["topic", "language", "audience", "area"];

function selected(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Cancun",
  }).format(new Date(value));
}

function labelFor(method: "curated" | "community_submitted") {
  return method === "curated" ? "Curated" : "Community-submitted";
}

export default async function GroupsPage({ searchParams }: { searchParams: SearchParams }) {
  const { groups, unavailable } = await getPublicGroups();
  const params = await searchParams;
  const requestedFilters = Object.fromEntries(filterNames.map((name) => [name, selected(params[name])])) as Record<FilterName, string>;
  const filters = normalizeGroupFilters(groups, requestedFilters);
  const filteredGroups = filterGroups(groups, filters);

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif", color: "#0f172a" }}>
      <GuideNav currentPath="/groups" />
      <p style={{ color: "#075985", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Playas in Playa</p>
      <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", margin: "8px 0" }}>WhatsApp groups</h1>
      <p style={{ color: "#475569", fontSize: 18, lineHeight: 1.55, maxWidth: 720 }}>Find active, verified group invitations for work, interests, and local life in Playa del Carmen. We show only publicly safe listing details.</p>

      <form aria-label="Filter WhatsApp groups" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, margin: "32px 0" }}>
        {filterNames.map((name) => (
          <label key={name} style={{ display: "grid", gap: 6, fontWeight: 700, textTransform: "capitalize" }}>
            {name}
            <select name={name} defaultValue={filters[name]} className="touch-control" style={{ border: "1px solid #94a3b8", borderRadius: 8, padding: "8px", background: "white" }}>
              <option value="">All {name}s</option>
              {groupFilterOptions(groups, name).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ))}
        <div style={{ alignSelf: "end", display: "flex", gap: 8 }}>
          <button type="submit" className="touch-target" style={{ border: 0, borderRadius: 8, background: "#075985", color: "white", fontWeight: 700, padding: "8px 16px", cursor: "pointer" }}>Apply filters</button>
          <Link href="/groups" className="touch-target" style={{ color: "#075985", fontWeight: 700 }}>Clear</Link>
        </div>
      </form>

      {unavailable ? (
        <section role="status" style={{ border: "1px solid #f59e0b", borderRadius: 12, padding: 20, background: "#fffbeb" }}>
          <h2>Listings are temporarily unavailable</h2><p>Please try again shortly. We have not shown any unverified fallback listings.</p>
        </section>
      ) : filteredGroups.length === 0 ? (
        <section role="status" style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 20, background: "#fff" }}>
          <h2>{groups.length ? "No groups match those filters" : "No verified groups are published yet"}</h2>
          <p>{groups.length ? "Try clearing a filter or check back after the next manual verification." : "We will add listings only after an admin verifies the invite page."}</p>
          <Link href="/submit" className="touch-target" style={{ color: "#075985", fontWeight: 700 }}>Suggest a listing or correction →</Link>
        </section>
      ) : (
        <section aria-label="Verified WhatsApp groups" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {filteredGroups.map((group) => <article key={group.id} style={{ display: "grid", gap: 12, border: "1px solid #cbd5e1", borderRadius: 14, padding: 20, background: "#fff" }}>
            <div><span style={{ display: "inline-block", borderRadius: 999, background: "#e0f2fe", color: "#075985", padding: "4px 8px", fontSize: 13, fontWeight: 700 }}>{labelFor(group.verification_method)}</span><h2 style={{ margin: "10px 0 4px" }}>{group.title}</h2>{group.description && <p style={{ color: "#475569", lineHeight: 1.5 }}>{group.description}</p>}</div>
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px", fontSize: 14 }}>
              {filterNames.map((name) => group[name] ? <Fragment key={name}><dt style={{ color: "#475569", textTransform: "capitalize" }}>{name}</dt><dd style={{ margin: 0 }}>{group[name]}</dd></Fragment> : null)}
              <dt style={{ color: "#475569" }}>Source</dt><dd style={{ margin: 0 }}>{group.provenance}</dd>
              <dt style={{ color: "#475569" }}>Last verified</dt><dd style={{ margin: 0 }}>{formatDate(group.last_verified_at)}</dd>
            </dl>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <GroupOpenLink href={group.link_url} />
              <Link href="/submit#report-problem" className="touch-target" style={{ color: "#075985", fontWeight: 700 }}>Report a problem</Link>
            </div>
          </article>)}
        </section>
      )}

      <section style={{ marginTop: 40, borderTop: "1px solid #cbd5e1", paddingTop: 24, maxWidth: 760 }}>
        <h2>How verification works</h2>
        <p style={{ lineHeight: 1.55, color: "#475569" }}>Verification means an admin confirmed a working invite page matched this listing. It is not proof that the group is active, moderated, or a fit for you.</p>
        <p style={{ lineHeight: 1.55, color: "#475569" }}>Groups are manually rechecked at least every 30 days. A failed check moves a listing out of the public directory until it is re-verified.</p>
      </section>
    </main>
  );
}
