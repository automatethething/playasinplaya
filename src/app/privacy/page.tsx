import type { Metadata } from "next";
import { GuideNav } from "@/components/GuideNav";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <main className="bulletin-shell legal-page">
      <GuideNav currentPath="/privacy" />
      <h1>Privacy</h1>
      <p>Playas in Playa publishes practical local guidance and, when available, curated listings. We do not publish submitter or organizer contact details.</p>
      <p>If you email a correction, we use your message only to review the reported content. Please do not send sensitive personal information.</p>
      <p><a className="touch-link" href="mailto:corrections@playasinplaya.com">Email corrections@playasinplaya.com about a correction</a></p>
      <p>This plain-language summary describes the current guide; it is not legal advice.</p>
    </main>
  );
}
