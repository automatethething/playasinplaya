# Direct PostgreSQL authorization audit

Status: completed for the current Supabase-shaped implementation. This is an audit record, not a replacement for the incremental adapter tests.

## Findings

- No `auth.uid()`, JWT claims, `current_setting()` request context, or PostgREST request context is used in SQL or application queries.
- No Supabase Storage or Realtime dependency was found.
- `anon`, `authenticated`, and `service_role` appear only in migration grants/revokes. They are Supabase compatibility roles, not application identity semantics.
- `moderate_directory_action(...)` and `cleanup_expired_intake_data()` are `SECURITY DEFINER` functions. They currently grant execution only to `service_role`; a direct PostgreSQL runtime must not inherit that privilege accidentally.
- RLS is enabled on the five base tables, but there are no explicit row-security policies. The current safety boundary is therefore grants plus the public projection view, not user-aware RLS.
- The public view filters active, published, non-expired rows and applies group freshness. It omits contact/moderation fields.
- ConsentKeys identity is handled by NextAuth and `ADMIN_USER_IDS` in application code. No user-owned rows or user-specific database authorization currently exist.

## Direct-role consequences

- `playasinplaya_app` must retain only the public projection read grant and narrowly defined intake permissions.
- It must not receive broad base-table mutation or moderation-function execution.
- Admin routes must continue to authenticate and authorize in the server application. Moderation writes should use a dedicated, explicitly granted function or a separate server-only admin connection, never a browser-visible path.
- If defense-in-depth is added for moderation, the server should set a transaction-local actor context after checking the ConsentKeys subject, and the function should reject missing/mismatched context. The actor value is pseudonymous ConsentKeys subject data only.
- There is no need to recreate `auth.uid()` for the current data model because no row ownership policy exists.

## Recommended incremental path

1. Add a server-only `pg` pool using only `playasinplaya_app`.
2. Replace public group/listing reads first and verify projection-only access.
3. Add dedicated parameterized intake functions or narrowly scoped grants for submissions, reports, and opt-ins.
4. Replace moderation RPC calls with a server-only direct function call and retain the existing NextAuth admin check; add transaction-local actor context before enabling the function for the runtime role.
5. Remove Supabase runtime imports only after each path has a passing integration test.

## Verification required before cutover

- Direct app-role connection returns the expected app role/database identity.
- App role can select the public projection but cannot select contact-bearing base tables.
- App role cannot execute moderation or retention functions without the intended server authorization path.
- Intake writes accept valid records and reject malformed/duplicate inputs.
- Admin moderation still records append-only audit events and rejects non-admin subjects.
- Browser output and client bundles contain no database URL, password, or connection details.
