import "server-only";
import { hasPostgresConfig, readPublicDeals, readPublicEvents } from "@/lib/postgres";
import {
  daysOfWeek,
  filterDealsByDay as filterDealsByDayRuntime,
  formatCancunDateTime as formatCancunDateTimeRuntime,
  formatDays as formatDaysRuntime,
  isPublicDeal as isPublicDealRuntime,
  isPublicEvent as isPublicEventRuntime,
  isSafeExternalUrl as isSafeExternalUrlRuntime,
  normalizeDealDay as normalizeDealDayRuntime,
} from "./listings.mjs";

export { daysOfWeek };

export type PublicEvent = {
  id: string;
  item_type: "event";
  title: string;
  description?: string | null;
  event_starts_at: string;
  venue: string;
  organizer_name: string;
  area?: string | null;
  source_url: string;
  provenance: string;
  last_verified_at: string;
  expires_at: string;
  status?: "active" | "pending" | "needs_review" | "archived";
  published_at: string;
};

export type PublicDeal = {
  id: string;
  item_type: "deal";
  title: string;
  description?: string | null;
  business_name: string;
  offer: string;
  deal_days: number[];
  area?: string | null;
  terms: string;
  source_url: string;
  provenance: string;
  last_verified_at: string;
  expires_at: string;
  status?: "active" | "pending" | "needs_review" | "archived";
  published_at: string;
};

export const isSafeExternalUrl = isSafeExternalUrlRuntime as (value: unknown) => boolean;
export const isPublicEvent = isPublicEventRuntime as (item: PublicEvent, now?: Date) => boolean;
export const isPublicDeal = isPublicDealRuntime as (item: PublicDeal, now?: Date) => boolean;
export const normalizeDealDay = normalizeDealDayRuntime as (value: unknown) => number | null;
export const filterDealsByDay = filterDealsByDayRuntime as (items: PublicDeal[], day: unknown, now?: Date) => PublicDeal[];
export const formatCancunDateTime = formatCancunDateTimeRuntime as (value: string) => string;
export const formatDays = formatDaysRuntime as (days: number[]) => string;

type PublicListingsResult<T> = { items: T[]; unavailable: boolean };

async function getPublicListings<T>(read: () => Promise<Record<string, unknown>[]>): Promise<PublicListingsResult<T>> {
  if (!hasPostgresConfig()) return { items: [], unavailable: false };
  try {
    return { items: await read() as T[], unavailable: false };
  } catch {
    return { items: [], unavailable: true };
  }
}

export function getPublicEvents() {
  return getPublicListings<PublicEvent>(readPublicEvents);
}

export function getPublicDeals() {
  return getPublicListings<PublicDeal>(readPublicDeals);
}
