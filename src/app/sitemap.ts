import type { MetadataRoute } from "next";
import { tipSlugs } from "@/lib/tips";

const base = "https://playasinplaya.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, lastModified: new Date("2026-03-29"), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/groups`, lastModified: new Date("2026-03-29"), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/tips`, lastModified: new Date("2026-03-29"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/events`, lastModified: new Date("2026-03-29"), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/deals`, lastModified: new Date("2026-03-29"), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/submit`, lastModified: new Date("2026-03-29"), changeFrequency: "monthly", priority: 0.4 },
    ...tipSlugs.map((slug) => ({ url: `${base}/tips/${slug}`, lastModified: new Date("2026-03-29"), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${base}/privacy`, lastModified: new Date("2026-03-29"), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date("2026-03-29"), changeFrequency: "monthly", priority: 0.3 },
  ];
}
