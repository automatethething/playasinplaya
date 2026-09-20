import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");
const home = read("src/app/page.tsx");
const eventsPage = read("src/app/events/page.tsx");
const content = read("src/components/EventsContent.tsx");
const styles = read("src/app/globals.css");

test("home renders the shared events experience with root navigation and canonical metadata", () => {
  assert.match(home, /import \{ EventsContent \} from "@\/components\/EventsContent"/);
  assert.match(home, /alternates: \{ canonical: "\/" \}/);
  assert.match(home, /<EventsContent currentPath="\/" heading="Things happening this week…" \/>/);
  assert.match(content, /<GuideNav currentPath=\{currentPath\} \/>/);
  assert.match(content, /<LumaCalendarEmbed \/>/);
  assert.match(content, /<EventMap eventCount=\{events\.length\} \/>/);
  assert.match(content, /getPublicEvents\(\)/);
  assert.match(content, /isPublicEvent\(item\)/);
});

test("events content uses the shared bulletin grid instead of inline page layout", () => {
  for (const className of ["bulletin-shell", "bulletin-masthead", "wordmark", "bulletin-hero", "events-content"]) {
    assert.match(content, new RegExp(`className="[^"]*${className}`));
  }
  assert.doesNotMatch(content, /<main style=/);
  assert.doesNotMatch(content, /<h1 style=/);
  assert.match(styles, /\.events-content \{[\s\S]*max-width: 1120px/);
  assert.match(styles, /\.events-hero \{[\s\S]*grid-template-columns:/);
  assert.match(styles, /@media \(max-width: 760px\) \{[\s\S]*\.events-hero \{[\s\S]*grid-template-columns: 1fr/);
});

test("events remains an alias with an events canonical and shared markup", () => {
  assert.match(eventsPage, /alternates: \{ canonical: "\/events" \}/);
  assert.match(eventsPage, /<EventsContent currentPath="\/events" heading="Events in Playa" \/>/);
  assert.doesNotMatch(eventsPage, /<LumaCalendarEmbed \/>/);
  assert.doesNotMatch(eventsPage, /<EventMap /);
});
