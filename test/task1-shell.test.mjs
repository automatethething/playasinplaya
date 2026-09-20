import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("public metadata uses the Playas in Playa canonical domain", () => {
  const layout = read("src/app/layout.tsx");
  const robots = read("src/app/robots.ts");
  const sitemap = read("src/app/sitemap.ts");
  for (const source of [layout, robots, sitemap]) assert.match(source, /https:\/\/playasinplaya\.com/);
  assert.match(layout, /Playas in Playa/);
});

test("indexable public routes define self-canonicals and match the sitemap", () => {
  const layout = read("src/app/layout.tsx");
  const sitemap = read("src/app/sitemap.ts");
  assert.doesNotMatch(layout, /alternates:\s*\{\s*canonical/);

  const routes = {
    "src/app/page.tsx": "/",
    "src/app/groups/page.tsx": "/groups",
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
});

test("all ten planned tip slugs have metadata and content files", () => {
  const expectedSlugs = [
    "arrival-basics", "coffee", "coworking", "esims", "food",
    "neighborhoods", "safety", "transportation", "urgent-care", "water",
  ];
  const tips = read("src/lib/tips.ts");
  const slugs = [...tips.matchAll(/^  "([a-z-]+)",$/gm)].map((match) => match[1]);
  assert.deepEqual(slugs, expectedSlugs);
  for (const slug of expectedSlugs) {
    const content = read(`content/tips/${slug}.md`);
    for (const field of ["title:", "description:", "updated:", "source_name:", "source_url:", "correction_url:"]) assert.match(content, new RegExp(`^${field}`, "m"));
    assert.match(content, /^updated: "\d{4}-\d{2}-\d{2}"$/m);
  }
});

test("tips index lists every slug and is linked from guide navigation", () => {
  const index = read("src/app/tips/page.tsx");
  const nav = read("src/components/GuideNav.tsx");
  const list = read("src/components/TipList.tsx");
  assert.match(index, /canonical: "\/tips"/);
  assert.match(index, /<TipList tips=\{tips\} \/>/);
  assert.match(nav, /href: "\/tips"/);
  assert.match(list, /href=\{`\/tips\/\$\{tip\.slug\}`\}/);
  for (const slug of ["arrival-basics", "coffee", "coworking", "esims", "food", "neighborhoods", "safety", "transportation", "urgent-care", "water"]) {
    assert.ok(read("src/lib/tips.ts").includes(`"${slug}"`));
  }
});
