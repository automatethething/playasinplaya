import type { Metadata } from "next";
import Link from "next/link";
import { GuideNav } from "@/components/GuideNav";

export const metadata: Metadata = {
  title: "Your local week in Playa del Carmen",
  description: "Find the people, places, and practical local intel that make Playa del Carmen feel like home.",
  alternates: { canonical: "/" },
};

const routes = [
  { href: "/groups", label: "Find your people", eyebrow: "WhatsApp groups", body: "Meetups, coworking, sports, language swaps, and local life — checked before we publish." },
  { href: "/events", label: "See what’s on", eyebrow: "This week", body: "A short list of things worth leaving the apartment for, with the organizer’s source attached." },
  { href: "/deals", label: "Spend smarter", eyebrow: "Local deals", body: "Useful offers from businesses serving the people who actually live here." },
  { href: "/tips", label: "Get oriented", eyebrow: "Local notes", body: "Straight answers on neighborhoods, water, eSIMs, transport, food, and arrival basics." },
];

export default function HomePage() {
  return (
    <main className="site-shell home-page">
      <header className="site-header">
        <Link href="/" className="brand-lockup" aria-label="Playas in Playa home"><span className="brand-mark" aria-hidden="true">P</span><span>Playas in Playa</span></Link>
        <div className="header-note"><span className="status-dot" aria-hidden="true" /> Playa del Carmen, MX</div>
      </header>

      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-stamp">A practical local guide</div>
        <div className="hero-grid">
          <div>
            <h1 id="home-title">Make Playa feel like <em>your</em> place.</h1>
            <p className="hero-lede">The useful layer beneath the vacation photos: people to meet, plans to make, and local knowledge that saves you a wrong turn.</p>
            <div className="hero-actions"><Link href="/groups" className="button button-primary">Find your people <span aria-hidden="true">↗</span></Link><Link href="/tips" className="button button-quiet">Start with the local notes</Link></div>
          </div>
          <aside className="hero-aside"><p className="aside-kicker">Updated for real life</p><p>English-first. Source-linked. Manually checked. Built for newcomers, remote workers, snowbirds, and the curious.</p><Link href="/submit" className="text-arrow">Know something useful? Tell us <span aria-hidden="true">→</span></Link></aside>
        </div>
      </section>

      <GuideNav currentPath="/" />

      <section className="route-section" aria-labelledby="route-title">
        <div className="section-intro"><p className="eyebrow">Choose your next move</p><h2 id="route-title">Start where you are.</h2><p>Whether you landed yesterday or have been here for years, skip the generic listicles and get to the useful stuff.</p></div>
        <div className="route-grid">{routes.map((route, index) => <Link href={route.href} className={`route-card route-card-${index + 1}`} key={route.href}><span className="route-number">0{index + 1}</span><div><p className="card-eyebrow">{route.eyebrow}</p><h3>{route.label} <span aria-hidden="true">↗</span></h3><p>{route.body}</p></div></Link>)}</div>
      </section>

      <section className="trust-band" aria-label="Editorial promise"><div><span className="trust-number">01</span><strong>Useful over exhaustive</strong><span>Fewer, better links.</span></div><div><span className="trust-number">02</span><strong>Fresh over viral</strong><span>Every listing has a check date.</span></div><div><span className="trust-number">03</span><strong>Local over polished</strong><span>Practical beats picturesque.</span></div></section>

      <section className="home-footer-cta"><div><p className="eyebrow">Keep the good stuff close</p><h2>Get the next useful thing in your inbox.</h2></div><Link href="/submit#opt-in" className="button button-primary">Join the local list <span aria-hidden="true">↗</span></Link></section>
      <footer className="site-footer"><span>Playas in Playa</span><span>Made for living here, not just visiting.</span></footer>
    </main>
  );
}
