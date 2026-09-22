import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { GroupOpenLink } from "@/components/GroupOpenLink";
import { GuideNav } from "@/components/GuideNav";
import { filterGroups, getPublicGroups, groupFilterOptions, normalizeGroupFilters } from "@/lib/groups";

export const metadata: Metadata = { title: "Find your people", description: "Verified Playa del Carmen WhatsApp groups for work, interests, and local life.", alternates: { canonical: "/groups" } };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type FilterName = "topic" | "language" | "audience" | "area";
const filterNames: FilterName[] = ["topic", "language", "audience", "area"];
function selected(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Cancun" }).format(new Date(value)); }
function labelFor(method: "curated" | "community_submitted") { return method === "curated" ? "Curated" : "Community-submitted"; }

export default async function GroupsPage({ searchParams }: { searchParams: SearchParams }) {
  const { groups, unavailable } = await getPublicGroups();
  const params = await searchParams;
  const requestedFilters = Object.fromEntries(filterNames.map((name) => [name, selected(params[name])])) as Record<FilterName, string>;
  const filters = normalizeGroupFilters(groups, requestedFilters);
  const filteredGroups = filterGroups(groups, filters);
  return <main className="site-shell directory-page">
    <header className="site-header"><Link href="/" className="brand-lockup"><span className="brand-mark" aria-hidden="true">P</span><span>Playas in Playa</span></Link><Link href="/submit" className="text-arrow">Suggest a group →</Link></header>
    <section className="directory-hero"><p className="eyebrow">The people layer</p><h1>Find your people.</h1><p>Playa gets better when you know who to ask. Browse active WhatsApp groups for work, hobbies, language swaps, and local life — then join at your own discretion.</p></section>
    <GuideNav currentPath="/groups" />
    <section className="filter-panel"><div><p className="eyebrow">Narrow it down</p><h2>What are you looking for?</h2></div><form aria-label="Filter WhatsApp groups" className="filter-form">{filterNames.map((name) => <label key={name}>{name}<select name={name} defaultValue={filters[name]}><option value="">All {name}s</option>{groupFilterOptions(groups, name).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>)}<div className="filter-actions"><button type="submit" className="button button-primary">Apply filters</button><Link href="/groups" className="button button-quiet">Clear</Link></div></form></section>
    {unavailable ? <section role="status" className="notice notice-warn"><p className="eyebrow">Directory status</p><h2>Listings are temporarily unavailable.</h2><p>Please try again shortly. We never fill the gaps with unverified fallback listings.</p></section> : filteredGroups.length === 0 ? <section role="status" className="notice"><p className="eyebrow">Quiet for now</p><h2>{groups.length ? "No groups match those filters" : "The first verified groups are coming soon"}</h2><p>{groups.length ? "Try clearing a filter or check back after the next manual verification." : "Suggest a useful group and we will check the invite page before it appears here."}</p><Link href="/submit" className="button button-primary">Suggest a listing →</Link></section> : <section className="group-grid" aria-label="Verified WhatsApp groups">{filteredGroups.map((group) => <article key={group.id} className="group-card"><div className="group-card-top"><span className="pill">{labelFor(group.verification_method)}</span><span className="group-area">{group.area || "Playa del Carmen"}</span></div><h2>{group.title}</h2>{group.description && <p>{group.description}</p>}<dl>{filterNames.map((name) => group[name] ? <Fragment key={name}><dt>{name}</dt><dd>{group[name]}</dd></Fragment> : null)}<dt>Checked</dt><dd>{formatDate(group.last_verified_at)}</dd></dl><div className="group-card-actions"><GroupOpenLink href={group.link_url} /><Link href="/submit#report-problem" className="text-arrow">Report a problem</Link></div></article>)}</section>}
    <section className="verification-note"><p className="eyebrow">Our standard</p><h2>Verified means checked, not guaranteed.</h2><p>An admin confirmed that the working invite page matched this listing. It is not proof that a group is active, moderated, or right for you. We recheck published groups at least every 30 days.</p></section>
  </main>;
}
