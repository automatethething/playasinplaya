import type { Metadata } from "next";
import { GuideNav } from "@/components/GuideNav";
import { TipList } from "@/components/TipList";
import { getTips } from "@/lib/tips";

export const metadata: Metadata = {
  title: "Local tips",
  description: "Practical Playa del Carmen tips with sources, update dates, and a correction path.",
  alternates: { canonical: "/tips" },
};

export default function TipsIndexPage() {
  const tips = getTips();

  return (
    <main className="bulletin-shell">
      <header className="bulletin-masthead">
        <div>
          <p className="eyebrow">Playa del Carmen, Mexico</p>
          <p className="wordmark">Playas in Playa</p>
        </div>
      </header>

      <section className="bulletin-hero">
        <div>
          <p className="section-kicker">Practical local guidance</p>
          <h1>Local tips</h1>
        </div>
        <p className="hero-copy">Ten short, sourced notes for settling in. This is general information, not medical, legal, or safety advice.</p>
      </section>

      <GuideNav currentPath="/tips" />
      <TipList tips={tips} />
    </main>
  );
}
