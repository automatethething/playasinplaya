"use client";

export const guideEvents = [
  "page_viewed",
  "group_opened",
  "submission_started",
  "submission_created",
  "report_created",
  "guide_opt_in",
] as const;

type GuideEvent = (typeof guideEvents)[number];

export function trackGuideEvent(event: GuideEvent) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://logs.petrichorlabs.ca";
  const payload = JSON.stringify({
    api_key: key,
    event,
    properties: { path: location.pathname },
  });
  navigator.sendBeacon?.(`${host}/capture/`, new Blob([payload], { type: "application/json" }));
}
