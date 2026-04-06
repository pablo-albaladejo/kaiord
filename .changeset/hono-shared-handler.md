---
"@kaiord/infra": minor
---

Extract shared Hono app from Lambda handler for local Garmin push dev server

- New `createApp()` factory in `app.ts` with shared HTTP logic (validation, error mapping, routes)
- Lambda handler is now a thin wrapper via `hono/aws-lambda` adapter
- New local dev server (`pnpm --filter @kaiord/infra dev:local`) on `localhost:3001`
- Local dev tests the exact same request handling code as production
- Added `GET /health` endpoint for readiness checks
