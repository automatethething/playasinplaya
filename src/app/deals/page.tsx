import type { Metadata } from "next";
import Link from "next/link";
import { GuideNav } from "@/components/GuideNav";
import { daysOfWeek, filterDealsByDay, formatDays, getPublicDeals, normalizeDealDay } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Weekly deals",
  description: "Manually verified weekly deals in Playa del Carmen, including terms, sources, and expiry dates.",
  alternates: { canonical: "/deals" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Cancun" }).format(new Date(value));
}

export default async function DealsPage({ searchParams }: { searchParams: SearchParams }) {
  const { items, unavailable } = await getPublicDeals();
  const params = await searchParams;
  const day = normalizeDealDay(firstValue(params.day));
  const deals = filterDealsByDay(items, day);

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif", color: "#0f172a" }}>
      <GuideNav currentPath="/deals" />
      <p style={{ color: "#075985", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Playas in Playa</p>
      <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", margin: "8px 0" }}>Weekly deals</h1>
      <p style={{ color: "#475569", fontSize: 18, lineHeight: 1.55, maxWidth: 720 }}>Deals are manually verified, carry their terms and source, and disappear after their recorded expiry date.</p>

      <form aria-label="Filter weekly deals by day" style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap", margin: "32px 0" }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 700 }}>
          Day of week
          <select name="day" defaultValue={day ?? ""} className="touch-control" style={{ minWidth: 200, border: "1px solid #94a3b8", borderRadius: 8, padding: "8px", background: "white" }}>
            <option value="">All days</option>
            {daysOfWeek.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
        </label>
        <button type="submit" className="touch-target" style={{ border: 0, borderRadius: 8, background: "#075985", color: "white", fontWeight: 700, padding: "8px 16px", cursor: "pointer" }}>Show deals</button>
        <Link href="/deals" className="touch-target" style={{ color: "#075985", fontWeight: 700 }}>Clear</Link>
      </form>

      {unavailable ? <section role="status" style={{ border: "1px solid #f59e0b", borderRadius: 12, padding: 20, background: "#fffbeb" }}><h2>Deals are temporarily unavailable</h2><p>Please try again shortly. We have not shown unverified fallback listings.</p></section>
        : deals.length === 0 ? <section role="status" style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 20, background: "#fff" }}><h2>{items.length ? "No current deals match that day" : "No verified deals are published yet"}</h2><p>{items.length ? "Try another day or clear the filter." : "We publish only deals with terms, a source, and an expiry date."}</p><Link href="/submit" className="touch-target" style={{ color: "#075985", fontWeight: 700 }}>Suggest a deal or correction →</Link></section>
          : <section aria-label="Verified weekly deals" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {deals.map((deal) => <article key={deal.id} style={{ display: "grid", gap: 12, border: "1px solid #cbd5e1", borderRadius: 14, padding: 20, background: "#fff" }}>
              <div><h2 style={{ margin: 0 }}>{deal.business_name}</h2><p style={{ color: "#075985", fontSize: 18, fontWeight: 700, margin: "8px 0" }}>{deal.offer}</p>{deal.description && <p style={{ color: "#475569", lineHeight: 1.5 }}>{deal.description}</p>}</div>
              <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px", fontSize: 14 }}>
                <dt style={{ color: "#475569" }}>Days</dt><dd style={{ margin: 0 }}>{formatDays(deal.deal_days)}</dd>
                {deal.area && <><dt style={{ color: "#475569" }}>Neighborhood</dt><dd style={{ margin: 0 }}>{deal.area}</dd></>}
                <dt style={{ color: "#475569" }}>Terms</dt><dd style={{ margin: 0 }}>{deal.terms}</dd>
                <dt style={{ color: "#475569" }}>Expires</dt><dd style={{ margin: 0 }}>{formatDate(deal.expires_at)}</dd>
                <dt style={{ color: "#475569" }}>Verified</dt><dd style={{ margin: 0 }}>{formatDate(deal.last_verified_at)}</dd>
              </dl>
              <a href={deal.source_url} target="_blank" rel="noreferrer" className="touch-target" style={{ borderRadius: 8, background: "#075985", color: "white", padding: "8px 14px", textDecoration: "none", fontWeight: 700 }}>View deal source <span className="sr-only">(opens in a new tab)</span> ↗</a>
            </article>)}
          </section>}
    </main>
  );
}
