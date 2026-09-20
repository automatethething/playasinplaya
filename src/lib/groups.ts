import "server-only";
import { readPublicGroups, hasPostgresConfig } from "@/lib/postgres";
import {
  filterGroups as filterGroupsRuntime,
  groupFilterOptions as groupFilterOptionsRuntime,
  isPublicGroup as isPublicGroupRuntime,
  normalizeGroupFilters as normalizeGroupFiltersRuntime,
} from "./groups.mjs";

export type GroupFilter = "topic" | "language" | "audience" | "area";

export type PublicGroup = {
  id: string;
  item_type: "group";
  title: string;
  description?: string | null;
  topic?: string | null;
  language?: string | null;
  audience?: string | null;
  area?: string | null;
  link_url: string;
  provenance: string;
  verification_method: "curated" | "community_submitted";
  published_at: string;
  last_verified_at: string;
  expires_at?: string | null;
  status?: "active" | "pending" | "needs_review" | "archived";
};

export const isPublicGroup = isPublicGroupRuntime as (item: PublicGroup, now?: Date) => boolean;
export const filterGroups = filterGroupsRuntime as (
  items: PublicGroup[],
  filters?: Partial<Record<GroupFilter, string>>,
  now?: Date,
) => PublicGroup[];
export const groupFilterOptions = groupFilterOptionsRuntime as (
  items: PublicGroup[],
  field: GroupFilter,
  now?: Date,
) => string[];
export const normalizeGroupFilters = normalizeGroupFiltersRuntime as (
  items: PublicGroup[],
  filters?: Partial<Record<GroupFilter, string>>,
  now?: Date,
) => Record<GroupFilter, string>;

type PublicGroupsResult = { groups: PublicGroup[]; unavailable: boolean };

export async function getPublicGroups(): Promise<PublicGroupsResult> {
  if (!hasPostgresConfig()) return { groups: [], unavailable: false };
  try {
    return { groups: await readPublicGroups() as PublicGroup[], unavailable: false };
  } catch {
    return { groups: [], unavailable: true };
  }
}
