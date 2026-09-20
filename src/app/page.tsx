import type { Metadata } from "next";
import { EventsContent } from "@/components/EventsContent";

export const metadata: Metadata = {
  title: "Things happening this week",
  description: "Manually curated Playa del Carmen events with source links and verification dates.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <EventsContent currentPath="/" heading="Things happening this week…" />;
}
