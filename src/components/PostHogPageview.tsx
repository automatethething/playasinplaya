"use client";

import { useEffect } from "react";
import { trackGuideEvent } from "@/components/Analytics";

export function PostHogPageview() {
  useEffect(() => trackGuideEvent("page_viewed"), []);
  return null;
}
