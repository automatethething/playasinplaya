import Link from "next/link";
import type { Tip } from "@/lib/tips";

export function TipList({ tips }: { tips: Tip[] }) {
  return (
    <div className="tip-list">
      {tips.map((tip, index) => (
        <Link key={tip.slug} href={`/tips/${tip.slug}`} className="tip-row">
          <span className="row-number">{String(index + 1).padStart(2, "0")}</span>
          <span>
            <strong>{tip.title}</strong>
            <span className="row-description">{tip.description}</span>
          </span>
          <span className="row-arrow" aria-hidden="true">→</span>
        </Link>
      ))}
    </div>
  );
}
