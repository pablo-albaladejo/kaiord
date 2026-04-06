# Design: Shared Hono App

## Decision 1: Hono as HTTP framework

**Layer:** Adapters (infra)

**Choice:** Hono

**Rationale:**

- ~14KB, zero transitive dependencies
- First-class adapters for AWS Lambda (`hono/aws-lambda`) and Node.js (`@hono/node-server`)
- Built-in CORS middleware, body size limiting, request ID, and JSON parsing
- Same app instance runs in both environments without modification
- Native `app.request()` test pattern — no running server needed for unit tests

**Alternatives considered:**

- Raw `node:http` — would require manual JSON parsing, CORS headers, error formatting. More code, same result.
- Express — heavier, no Lambda adapter, would need `serverless-http` wrapper.
- Fastify — good but heavier, Lambda support via separate plugin.

## Decision 2: File structure

**Layer:** Adapters (infra)

```
packages/infra/src/lambda/
├── app.ts            ← NEW: Hono app with GET /health + POST / routes
├── handler.ts        ← MODIFIED: thin Lambda wrapper importing app
├── dev-server.ts     ← NEW: local Node.js server importing app
├── garmin-push.ts    ← UNCHANGED
├── proxy-fetch.ts    ← UNCHANGED (WARNING: mutates global state, never import in dev-server)
├── request-schema.ts ← UNCHANGED
└── response.ts       ← REMOVED (replaced by Hono's c.json())
```

`isAuthError` and `isRateLimited` helpers move from `handler.ts` into `app.ts` as they are shared HTTP concerns.

**Rationale:** Keeps all HTTP handling in the same directory. `response.ts` becomes unnecessary because Hono provides `c.json()` and status code handling natively.

## Decision 3: Tailscale as middleware hook

**Layer:** Adapters (infra)

The Hono app accepts an `onBeforePush` middleware via its factory, applied only to `POST /` (not globally). This ensures `GET /health` always works regardless of infrastructure state. The Lambda entry point passes a middleware that:

1. Checks `useTailscale()` (env var guard)
2. Calls `enableSocksProxy()` to set the global SOCKS5 dispatcher
3. Calls `checkTunnelHealth()` to verify the tunnel is up
4. Returns HTTP 503 via `c.json({ error: "Proxy tunnel unavailable" }, 503)` if the health check fails

The dev server passes nothing — calls go directly to Garmin.

```typescript
// app.ts
export const createApp = (options?: { onBeforePush?: MiddlewareHandler }) => {
  const app = new Hono();
  app.use("*", requestId());
  app.get("/health", (c) => c.json({ status: "ok" }));
  // onBeforePush only on POST /, not global
  app.post("/", bodyLimit(...), options?.onBeforePush ?? passthrough, pushHandler);
  return app;
};
```

**Rationale:** Avoids environment detection (`process.env`) inside the shared app. Each entry point explicitly declares its infrastructure concerns. `proxy-fetch.ts` mutates global state via `setGlobalDispatcher()` and MUST NOT be imported in `dev-server.ts`.

## Decision 4: CORS only in dev-server.ts

**Layer:** Adapters (infra)

CORS middleware is applied in `dev-server.ts` only, not in the shared app. The Lambda relies on API Gateway CORS configuration.

The CORS origin is configurable via `CORS_ORIGIN` env var, defaulting to `http://localhost:5173`. This handles cases where Vite auto-increments the port on conflict.

## Decision 5: Dev server security

**Layer:** Adapters (infra)

The dev server binds to `127.0.0.1` only to prevent exposure on the local network. Credentials transit in plaintext over HTTP — this is a known and accepted limitation for local development.

## Decision 6: No new package

**Layer:** Project structure

The dev server lives in `@kaiord/infra` as a script (`dev:local`). No new `@kaiord/dev-server` package. `@hono/node-server` is a `devDependency` since it is only used by the dev server and must not be bundled in the Lambda.

**Rationale:** The dev server is a development tool, not a publishable artifact. It shares dependencies already present in `@kaiord/infra` (`@kaiord/core`, `@kaiord/garmin-connect`, `zod`).

## Decision 7: Testing with app.request()

**Layer:** Adapters (infra)

Unit tests for `app.ts` use Hono's native `app.request()` pattern — no running server, no ports, no network. This keeps tests fast and deterministic.

```typescript
const app = createApp();
const res = await app.request("/health");
expect(res.status).toBe(200);
```

## Migration Plan

No public API changes. The Lambda export remains `export { handler }`. The CDK stack references the same entry point. Existing deployments are unaffected.
