import type { Metadata } from "next";
import { EventsContent } from "@/components/EventsContent";

export const metadata: Metadata = {
  title: "Events",
  description: "Manually curated Playa del Carmen events with source links and verification dates.",
  alternates: { canonical: "/events" },
};

export default function EventsPage() {
  return <EventsContent currentPath="/events" heading="Events in Playa" />;
}
