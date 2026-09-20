import type { Metadata } from "next";
import { GuideNav } from "@/components/GuideNav";

export const metadata: Metadata = { title: "Guide terms", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <main className="bulletin-shell legal-page">
      <GuideNav currentPath="/terms" />
      <h1>Guide terms</h1>
      <p>Playas in Playa is general local information, not travel, medical, legal, or safety advice. Verify details directly with the relevant business, organizer, group administrator, or qualified professional before relying on them.</p>
      <p>Do not use this guide to harass, dox, or publicly accuse people. We may correct, remove, or decline content that is inaccurate, unsafe, or not appropriate for the guide.</p>
      <p>This plain-language summary is not legal advice.</p>
    </main>
  );
}
