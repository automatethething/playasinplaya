import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");

test("analytics events are allowlisted and pathname-only", () => {
  const analytics = read("src/components/Analytics.tsx");
  for (const event of ["page_viewed", "group_opened", "submission_started", "submission_created", "report_created", "guide_opt_in"]) {
    assert.match(analytics, new RegExp(`"${event}"`));
  }
  assert.match(analytics, /properties: \{ path: location\.pathname \}/);
  assert.doesNotMatch(analytics, /location\.(href|search|hash)/);
  assert.doesNotMatch(analytics, /contact|token|email/i);
  const forms = read("src/components/SubmissionForm.tsx");
  for (const event of ["submission_started", "submission_created", "report_created", "guide_opt_in"]) assert.ok(forms.includes(`trackGuideEvent("${event}")`));
  assert.ok(read("src/components/GroupOpenLink.tsx").includes('trackGuideEvent("group_opened")'));
});

test("submission controls provide 44px touch targets", () => {
  const forms = read("src/components/SubmissionForm.tsx");
  assert.match(forms, /const controlStyle = \{ minHeight: 44 \}/);
  assert.match(forms, /const checkboxStyle = \{ minWidth: 44, minHeight: 44/);
  assert.ok((forms.match(/style=\{controlStyle\}/g) || []).length >= 16);
  assert.ok((forms.match(/style=\{checkboxStyle\}/g) || []).length >= 3);
});

test("PWA, group, and standalone action links provide genuine 44px targets", () => {
  const prompt = read("src/components/PwaInstallPrompt.tsx");
  assert.match(prompt, /aria-label="Dismiss install prompt" style=\{\{[^}]*minWidth: 44, minHeight: 44/);
  assert.equal((prompt.match(/minHeight: 44/g) || []).length, 3);
  const groupLink = read("src/components/GroupOpenLink.tsx");
  assert.match(groupLink, /display: "inline-flex", minHeight: 44, alignItems: "center"/);
  for (const file of ["src/app/submit/page.tsx", "src/app/privacy/page.tsx"]) {
    assert.match(read(file), /className="touch-link" href="mailto:corrections@playasinplaya\.com"/);
  }
  assert.match(read("src/app/submit/page.tsx"), /GuideNav currentPath="\/submit"/);
  assert.match(read("src/app/dashboard/page.tsx"), /button className="touch-target"[^>]*>Sign in with ConsentKeys/);
  assert.match(read("src/app/globals.css"), /\.touch-link \{ display: inline-flex; align-items: center; min-height: 44px; \}/);
});

test("guide navigation has route buttons, current state, and a real back link", () => {
  const nav = read("src/components/GuideNav.tsx");
  for (const [href, label] of [["/", "Home"], ["/groups", "WhatsApp groups"], ["/events", "Events"], ["/deals", "Deals"], ["/tips", "Local tips"], ["/submit", "Submit"]]) {
    assert.ok(nav.includes(`href: "${href}"`));
    assert.ok(nav.includes(`label: "${label}"`));
  }
  assert.match(nav, /← Guide home/);
  assert.match(nav, /aria-current=\{current \? "page" : undefined\}/);
  assert.match(read("src/app/globals.css"), /\.guide-route \{[^}]*min-height: (4[4-9]|5[0-9])px/);
  assert.match(nav, /currentPath\.startsWith\("\/tips"\)/);
  for (const [file, pathName] of [["src/app/groups/page.tsx", "/groups"], ["src/app/events/page.tsx", "/events"], ["src/app/deals/page.tsx", "/deals"]]) {
    assert.ok(read(file).includes(`currentPath="${pathName}"`));
  }
  assert.match(read("src/app/page.tsx"), /currentPath="\/"/);
  assert.match(read("src/components/EventsContent.tsx"), /<GuideNav currentPath=\{currentPath\} \/>/);
});

test("events page embeds the official Luma calendar as a live source", () => {
  const calendar = read("src/components/LumaCalendarEmbed.tsx");
  assert.match(calendar, /luma\.com\/embed\/calendar\/cal-8QsN0OjVFEipsG8\/events/);
  assert.match(calendar, /title="Live Luma events in Playa del Carmen"/);
  assert.match(calendar, /Browse the public Luma calendar/);
  assert.match(calendar, /target="_blank"/);
  assert.match(calendar, /loading="lazy"/);
  assert.match(read("src/components/EventsContent.tsx"), /LumaCalendarEmbed/);
});

test("events page has a responsive map panel without claiming event pin data", () => {
  const map = read("src/components/EventMap.tsx");
  assert.match(map, /openstreetmap\.org\/export\/embed\.html/);
  assert.match(map, /title="Playa del Carmen event map"/);
  assert.match(map, /loading="lazy"/);
  assert.match(read("src/components/EventsContent.tsx"), /EventMap/);
  assert.match(read("src/app/globals.css"), /\.events-layout \{/);
});

test("public route canonicals are self-referential and sitemap-consistent", () => {
  const sitemap = read("src/app/sitemap.ts");
  const routes = {
    "src/app/events/page.tsx": "/events",
    "src/app/deals/page.tsx": "/deals",
    "src/app/tips/page.tsx": "/tips",
    "src/app/submit/page.tsx": "/submit",
    "src/app/privacy/page.tsx": "/privacy",
    "src/app/terms/page.tsx": "/terms",
  };
  for (const [file, canonical] of Object.entries(routes)) {
    assert.match(read(file), new RegExp(`canonical: ["']${canonical}["']`));
    assert.match(sitemap, new RegExp(`\\$\\{base\\}${canonical.replace("/", "\\/")}`));
  }
  const tips = read("src/app/tips/[slug]/page.tsx");
  assert.match(tips, /alternates: \{ canonical: `\/tips\/\$\{tip\.slug\}` \}/);
  assert.match(sitemap, /\$\{base\}\/tips\/\$\{slug\}/);
});

test("SEO, PWA, and accessibility release assets are present", () => {
  const layout = read("src/app/layout.tsx");
  for (const field of ["metadataBase", "openGraph", "twitter", "manifest", "favicon.ico"]) assert.match(layout, new RegExp(field));
  assert.match(read("src/app/robots.ts"), /playasinplaya\.com\/sitemap\.xml/);
  assert.match(read("src/app/sitemap.ts"), /https:\/\/playasinplaya\.com/);
  assert.match(read("src/app/manifest.ts"), /display: "standalone"/);
  assert.match(read("public/llms.txt"), /Playas in Playa/);
  assert.match(read("public/llms.txt"), /\/tips/);
  assert.match(read("public/llms.txt"), /\/groups/);
  for (const asset of ["src/app/favicon.ico", "src/app/opengraph-image.tsx", "src/app/twitter-image.tsx", "public/icon-192.png", "public/icon-512.png", "public/icon-maskable-512.png"]) assert.ok(fs.existsSync(path.resolve(asset)), `${asset} is required`);
  const css = read("src/app/globals.css");
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-width: 320px/);
});
