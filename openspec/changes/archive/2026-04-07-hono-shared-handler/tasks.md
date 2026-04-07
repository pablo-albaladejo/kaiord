# Tasks: Shared Hono App

## 1. Dependencies

- [x] Add `hono` to `@kaiord/infra` dependencies
- [x] Add `@hono/node-server` to `@kaiord/infra` **devDependencies**

## 2. Shared Hono app (adapter layer)

- [x] Create `packages/infra/src/lambda/app.ts` — Hono app factory with `createApp(options?)`
  - `GET /health` route → `{ status: "ok" }` (HTTP 200) — no middleware, always available
  - `POST /push` route with:
    - Hono `bodyLimit` middleware (512KB, custom handler returning `{ error: "Payload too large" }`)
    - Optional `onBeforePush` middleware (applied only to `POST /push`, NOT globally)
    - JSON body parsing + Zod validation via `pushRequestSchema`
    - Calls `pushToGarmin(krd, credentials)`
    - Returns `{ id, name, url }` on success
  - Hono `requestId` middleware applied globally
  - Move `isAuthError` and `isRateLimited` helpers from `handler.ts` into `app.ts`
  - Error classification: auth → 401, rate limit → 429, other → 500
  - Error logs include `requestId`, truncate error messages to 100 chars
- [x] Remove `packages/infra/src/lambda/response.ts` (replaced by Hono `c.json()`)

## 3. Lambda entry point (adapter layer)

- [x] Refactor `packages/infra/src/lambda/handler.ts` — thin wrapper
  - Import `createApp` from `app.ts`
  - Pass Tailscale middleware as `onBeforePush` (guarded by `useTailscale()` env check)
    - Calls `enableSocksProxy()` + `checkTunnelHealth()` → returns 503 if fails
  - Export `handler` via `hono/aws-lambda` adapter (`handle()`)

## 4. Local dev server (adapter layer)

- [x] Create `packages/infra/src/lambda/dev-server.ts`
  - Import `createApp` from `app.ts` (NO Tailscale middleware)
  - Add CORS middleware with origin from `CORS_ORIGIN` env var (default `http://localhost:5173`)
  - Bind to `127.0.0.1` only (NOT `0.0.0.0`)
  - Serve via `@hono/node-server` on port from `PORT` env var (default 3001)
  - Log startup message with URL
- [x] Add `dev:local` script to `packages/infra/package.json`: `tsx src/lambda/dev-server.ts`

## 5. Tests

- [x] Add unit tests for `app.ts` using `app.request()` (Hono native test pattern):
  - `GET /health` returns 200 + `{ status: "ok" }`
  - Validation errors return 400
  - Oversized payload returns 413
  - Auth error classification returns 401
  - Rate limit error classification returns 429
  - Generic error returns 500
  - `onBeforePush` middleware executes before push handler (spy test)
  - `onBeforePush` does NOT affect `GET /health`
  - `GET /health` returns 200 even when `onBeforePush` would return 503
  - `requestId` header is present in responses
  - Error log messages are truncated to 100 chars
  - `bodyLimit` returns `{ error: "Payload too large" }` (SPA-compatible shape)
- [x] Verify existing Lambda handler tests still pass (or update to new structure)

## 6. Documentation & release

- [ ] Add changeset (`pnpm exec changeset`) — deferred to PR time
- [x] Update `CLAUDE.md` commands section with `dev:local` usage
