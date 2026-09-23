# Playas in Playa

A practical, English-first Playa del Carmen guide for newcomers, remote workers, snowbirds, and expats.

## What is live

- Home and Events: live Luma calendar plus manually curated events when a verified listing exists
- WhatsApp groups and weekly deals: public directories of approved, unexpired listings
- Local tips: ten sourced guide pages with update dates and a correction path
- Submit: anonymous group/event/deal suggestions, reports, and email opt-ins
- Admin: ConsentKeys-protected moderation for authorized operators

Public pages still render when the directory database is not configured. They show an empty verified-listings state rather than unpublished or fallback records. Submissions, reports, opt-ins, and `/api/health` require the PostgreSQL runtime.

## Development

```bash
npm install
npm test
npm run lint
npm run typecheck
npm run build
```

Set `NEXT_PUBLIC_APP_URL` to the canonical app URL. Public visitors do not need an account. The ConsentKeys dashboard is an admin boundary only.

## PostgreSQL runtime

Public group, event, and deal reads use the server-only `pg` adapter against the app-owned `playasinplaya` schema by default. Configure the discrete `PLAYASINPLAYA_DB_*` names, or a pooled URL in `PLAYASINPLAYA_DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, or `DATABASE_URL`. `PLAYASINPLAYA_DB_SCHEMA=public` is retained only as an explicit rollback switch. Never prefix these values with `NEXT_PUBLIC_` or put them in client code. The adapter uses a maximum of three pooled connections and TLS certificate verification.

The starter dashboard remains a separate legacy data path and is not part of the public guide database.

## Self-hosted runtime bundle

Build and run the included non-root container on port 3000:

```bash
docker build -t playasinplaya .
docker run --env-file /secure/playasinplaya.env -p 3000:3000 playasinplaya
```

Without Docker, the production start command is:

```bash
npm run build
PORT=3000 npm run start -- --hostname 0.0.0.0 --port 3000
```

`GET /api/health` returns only `{ "ok": true }` with HTTP 200 when the server has a configured, reachable PostgreSQL runtime role. It returns only `{ "ok": false }` with HTTP 503 for missing configuration or any database failure. It never returns connection or error details.

Provide these environment variable names through the host's secret store, never in the image or repository: `PLAYASINPLAYA_DB_HOST`, `PLAYASINPLAYA_DB_PORT`, `PLAYASINPLAYA_DB_NAME`, `PLAYASINPLAYA_DB_USER`, `PLAYASINPLAYA_DB_PASSWORD`, `PLAYASINPLAYA_DB_SSL_CA`, `PLAYASINPLAYA_DB_SCHEMA`, `CONSENTKEYS_CLIENT_ID`, `CONSENTKEYS_CLIENT_SECRET`, `CONSENTKEYS_ISSUER`, `CONSENTKEYS_CALLBACK_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_USER_IDS`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, and `NEXT_PUBLIC_POSTHOG_HOST`.

## Content standards

Every tip has a source, verification date, and correction address. Guide content is general information, not medical, legal, travel, or safety advice. Directory listings appear only after manual verification. Do not add secrets to the repository.
