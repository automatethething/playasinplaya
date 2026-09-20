import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideNav } from "@/components/GuideNav";
import { TipList } from "@/components/TipList";
import { getTip, getTips, tipSlugs } from "@/lib/tips";

export function generateStaticParams() {
  return tipSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tip = getTip(slug);
  if (!tip) return {};
  return {
    title: tip.title,
    description: tip.description,
    alternates: { canonical: `/tips/${tip.slug}` },
  };
}

export default async function TipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tip = getTip(slug);
  if (!tip) notFound();
  const relatedTips = getTips().filter((item) => item.slug !== tip.slug);

  return (
    <main className="bulletin-shell tip-article">
      <GuideNav currentPath={`/tips/${tip.slug}`} />
      <p className="section-kicker">Local tip</p>
      <h1>{tip.title}</h1>
      <p className="hero-copy">{tip.description}</p>
      {tip.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <hr />
      <p><strong>Last updated:</strong> {tip.updated}</p>
      <p><strong>Source:</strong> <a href={tip.source_url} target="_blank" rel="noreferrer" className="touch-target">{tip.source_name} (opens in a new tab)</a></p>
      <p>Spot something outdated? <a href={tip.correction_url} className="touch-target">Send a correction</a>. We review local guidance before updating it.</p>
      <section className="bulletin-section" aria-label="More local tips">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Keep reading</p>
            <h2>More local tips</h2>
          </div>
        </div>
        <TipList tips={relatedTips} />
      </section>
    </main>
  );
}
