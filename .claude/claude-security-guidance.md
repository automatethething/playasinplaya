# Security guidance for Flowstate apps

These rules are for Claude Code's `security-guidance` plugin and for any agent reviewing this repo.

## Identity and auth

- ConsentKeys apps store pseudonymous identity fields, but access tokens, refresh tokens, sessions, cookies, auth headers, provider tokens, and callback state are real secrets.
- Never log access tokens, refresh tokens, session tokens, cookies, authorization headers, ConsentKeys raw responses, provider tokens, OAuth state, nonce, or code verifier values.
- Treat `userinfo.sub` as the canonical user ID. Do not trust client-supplied user IDs for ownership.
- API routes that read or mutate user data must verify the authenticated user server-side before any database read or write.
- OAuth/OIDC flows must validate issuer, audience, expiry, nonce/state, and callback origin where applicable.

## Supabase and data access

- Every table in shared Supabase must be app-namespaced and have RLS enabled.
- RLS policies must match the real identity model, not UI assumptions.
- Service-role keys are server-side only. They must never appear in client bundles, browser code, logs, public env vars, or responses.
- Admin/service operations must live in server-only code and still validate the requested app namespace and user ownership.
- No IDOR: do not fetch by arbitrary `id` unless ownership or public visibility has been checked.

## Payments

- Do not use Stripe directly. Flowstate apps use Petrichor Labs PayRails.
- PayRails webhooks must verify signatures, persist event IDs, and be idempotent.
- Checkout/order routes must verify the authenticated user or signed token before issuing paid actions.

## Browser, PWA, and client security

- Do not cache authenticated API responses or private user pages in service workers.
- PWA installability is fine without offline caching. Prefer static asset caching only unless offline private-data behavior is explicitly designed and reviewed.
- Treat `dangerouslySetInnerHTML`, `.innerHTML`, `document.write`, and markdown rendering as security-sensitive. Only render sanitized trusted content.
- Avoid putting secrets, internal URLs, private tokens, or account identifiers into client-visible HTML, localStorage, analytics, or error messages.

## Inputs, AI, and external calls

- Treat uploaded files, URLs, pasted text, and AI prompt context as untrusted.
- Do not pass raw user input to shell commands, SQL strings, server-side fetch URLs, or AI tool instructions without validation and scoping.
- Server-side fetches influenced by users must block internal/private IPs and unexpected protocols.
- Webhook handlers must verify provider signatures before parsing side effects.

## Logging and monitoring

- Log enough to debug auth, payment, and database issues, but redact secrets and bearer credentials.
- Security failures should include route/action names and pseudonymous user IDs when safe, not raw payloads.
- Do not log real PII. ConsentKeys pseudonymous name/email is lower risk, but still avoid dumping full user objects.

## Merge blockers

Block the change if it introduces any of these:

- missing auth or ownership checks on private data
- missing RLS on shared Supabase tables
- service-role key exposure to client code
- direct Stripe usage
- unsigned payment/webhook side effects
- unsafe HTML rendering of user-controlled content
- service worker caching of private authenticated responses
- hardcoded secrets or provider tokens
