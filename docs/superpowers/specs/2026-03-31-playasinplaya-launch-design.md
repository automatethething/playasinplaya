# Playas in Playa launch design

## Direction

Position Playas in Playa as the practical local layer beneath the vacation internet: people to meet, plans to make, and specific knowledge that helps newcomers live well in Playa del Carmen. The visual system is warm editorial utility: paper, ink, Caribbean teal, coral, and sun yellow; large serif display type; compact monospace labels; straight edges; and no resort-template gradients or generic card stacks.

## Homepage

The homepage is a decision surface, not an event feed. It leads with “Make Playa feel like your place,” then gives four clear routes: find people, see what’s on, spend smarter, and get oriented. A three-part editorial promise (useful, fresh, local) makes the verification posture visible without overclaiming.

## Directory surfaces

Groups adopts the same shell and hierarchy as the homepage. Filters remain functional, but inline styling is removed in favor of shared visual tokens. Empty and unavailable states remain honest and become first-class editorial states.

## Data cutover

WireGuard remains a bottleneck whenever the app’s server-only `pg` pool points at a private database host. The safe launch path is an app-owned `playasinplaya` schema inside the shared Supabase “dream ideas” project, reached through Supabase’s pooled Postgres endpoint. The migration must create only new objects in that schema and must not alter, drop, or grant broad access to existing production tables. Public reads use a narrow projection. RLS is enabled on base tables and the app role receives only the minimum schema/view permissions.

The first cutover targets public directory reads and health readiness. Intake and moderation remain behind the existing server-only path until their equivalent isolated functions are migrated and verified; no production table is repurposed as a shortcut.

## Verification

Run the repository test suite, lint, typecheck, and production build. Review the migration for absence of destructive statements and verify the app source references only the isolated public projection for directory reads. Production health and fresh browser verification require the owner to apply the migration and set the pooled connection secrets in the hosting environment.
