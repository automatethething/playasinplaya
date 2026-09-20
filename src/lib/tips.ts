import fs from "node:fs";
import path from "node:path";

type TipFrontmatter = {
  title: string;
  description: string;
  updated: string;
  source_name: string;
  source_url: string;
  correction_url: string;
};

export type Tip = TipFrontmatter & { slug: string; body: string };

const contentDirectory = path.join(process.cwd(), "content", "tips");

export const tipSlugs = [
  "arrival-basics",
  "coffee",
  "coworking",
  "esims",
  "food",
  "neighborhoods",
  "safety",
  "transportation",
  "urgent-care",
  "water",
] as const;

function parseTip(slug: string): Tip {
  const source = fs.readFileSync(path.join(contentDirectory, `${slug}.md`), "utf8");
  const match = source.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Invalid frontmatter for tip: ${slug}`);

  const fields = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const [key, ...value] = line.split(":");
      return [key, value.join(":").trim().replace(/^"|"$/g, "")];
    }),
  ) as TipFrontmatter;

  return { ...fields, slug, body: match[2].trim() };
}

export function getTip(slug: string) {
  return tipSlugs.includes(slug as (typeof tipSlugs)[number]) ? parseTip(slug) : null;
}

export function getTips() {
  return tipSlugs.map(parseTip);
}
