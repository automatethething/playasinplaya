# Next.js + ConsentKeys + Supabase App Starter

Copy this scaffold when creating a new Flowstate app that needs:
- ConsentKeys auth
- server-side Supabase access
- a logged-in dashboard shell
- namespaced upload/task/testing table stubs

## Includes
- Next.js metadata baseline
- ConsentKeys Auth.js wiring
- typed session extensions
- server-side Supabase helper
- text layout helper (`src/lib/text-layout.ts`) using `@chenglou/pretext` for deterministic multiline measurement
- PWA install prompt helper and starter app icons
- Claude Code security-guidance files for in-session vulnerability review
- homepage with sign-in CTA
- dashboard shell
- privacy/terms starter pages
- upload/task/testing SQL starter migration
- `.env.example`

## Usage
1. Copy into `repos/[app-name]`
2. Replace placeholder app name/domain/table prefixes
3. Set `NEXT_PUBLIC_APP_URL`
4. Fill in ConsentKeys and Supabase env vars
5. Review `_templates/builders/new-app-starter-pack.md`
6. Review `_templates/builders/consentkeys.md`
7. Review `_templates/builders/supabase.md`
8. Run `_templates/builders/launch-checklist.md`

## Important
- Do not reuse ConsentKeys credentials from another app
- Do not use un-namespaced DB objects
- New `public` schema tables on Supabase require explicit `GRANT` statements for any Data API role that should reach them; this starter grants `service_role` only by default
- Run both `node --test test/supabase-rls.test.mjs` and `node --test test/supabase-public-grants.test.mjs` when changing Supabase migrations
- Run `node --test src/lib/pwaInstall.test.mjs` when changing the PWA install prompt helper
- Keep `.claude/claude-security-guidance.md` and `.claude/security-patterns.yaml` with the repo so Claude Code and reviewers get Flowstate-specific security rules
- Do not trust uploaded files without scanning/review

## Claude Code security plugin
If using Claude Code in this repo, install the official plugin once in your Claude session:

```text
/plugin marketplace add anthropics/claude-plugins-official
/plugin install security-guidance@claude-plugins-official
/reload-plugins
```

This starter includes `.claude/settings.json` to enable the plugin for the repo when available. The plugin is a guardrail, not a merge gate; still run the Flowstate security review and CI checks.

## Optional UI usage example
```ts
import { measureTextHeight } from "@/lib/text-layout";

const { height, lineCount } = await measureTextHeight({
  text: "Dynamic card copy...",
  width: 320,
  font: "16px Inter",
  lineHeight: 24,
});
```
Use this when you need stable text height before render (virtualization, masonry, dense cards).
