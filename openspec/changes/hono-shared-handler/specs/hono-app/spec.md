# Shared Hono App Spec

## Requirements

### Requirement: Single HTTP definition

The Hono app (`app.ts`) SHALL define all HTTP behavior (request parsing, validation, error mapping, response formatting) exactly once. Both the Lambda handler and the local dev server SHALL consume the same app instance.

### Requirement: POST route contract

The app SHALL expose a `POST /` route that:

1. Parses the JSON body as `{ krd, garmin: { username, password } }`
2. Validates against `pushRequestSchema` (Zod)
3. Calls `pushToGarmin(krd, credentials)`
4. Returns `{ id, name, url }` on success (HTTP 200)
5. Returns `{ error }` with appropriate status code on failure (400, 401, 429, 500)

### Requirement: Health check route

The app SHALL expose a `GET /health` route returning HTTP 200 with `{ status: "ok" }`. This serves both local DX (verify server is running) and future ALB health checks.

### Requirement: Payload size limit

The app SHALL reject request bodies larger than 512KB with HTTP 413 using Hono's `bodyLimit` middleware applied only to `POST /` (not globally). The `bodyLimit` handler SHALL return `{ error: "Payload too large" }` to match the SPA client's expected error shape.

### Requirement: Error classification

The app SHALL contain `isAuthError` and `isRateLimited` helpers (moved from `handler.ts`) and map errors identically to the current Lambda handler:

- Auth errors (`authentication`, `Login failed`, `locked`) -> 401
- Rate limiting (`429`, `Too Many Requests`) -> 429
- All other errors -> 500

Error responses SHALL never include credentials or raw stack traces. Error logs SHALL truncate error messages to 100 characters maximum to prevent credential fragments from leaking into log sinks.

### Requirement: Request ID middleware

The app SHALL use Hono's built-in `requestId` middleware to assign a unique ID to every request. Error logs SHALL include this request ID for traceability in both Lambda and local environments.

### Requirement: Tailscale proxy conditional

The app SHALL accept an optional `onBeforePush` middleware via the `createApp` factory. This middleware SHALL be applied only to `POST /`, NOT globally. The `GET /health` route MUST remain unaffected by infrastructure middleware so it returns 200 even when the Tailscale tunnel is down. The Lambda entry point SHALL pass a middleware that checks `useTailscale()`, calls `enableSocksProxy()` and `checkTunnelHealth()`, returning HTTP 503 with `{ error: "Proxy tunnel unavailable" }` if the health check fails. The local dev server SHALL NOT pass this middleware.

### Requirement: CORS in dev only

The local dev server SHALL enable CORS with origin configurable via `CORS_ORIGIN` environment variable, defaulting to `http://localhost:5173`. The Lambda handler SHALL NOT add CORS headers (API Gateway handles this).

### Requirement: Dev server binding

The local dev server SHALL bind to `127.0.0.1` only (NOT `0.0.0.0`) to prevent exposure on the local network. Port SHALL default to 3001, configurable via `PORT` environment variable.

### Requirement: Dev server is dev-only

`@hono/node-server` SHALL be listed as a `devDependency` in `package.json` to prevent it from being bundled into the Lambda deployment.

## Scenarios

#### Scenario: Local push succeeds

- **GIVEN** the dev server is running on `127.0.0.1:3001`
- **AND** the SPA Lambda URL is configured to `http://localhost:3001`
- **WHEN** the user clicks "Push to Garmin" with valid credentials and a KRD workout
- **THEN** the workout is pushed to Garmin Connect and the SPA shows the Garmin Connect URL

#### Scenario: Lambda push unchanged

- **GIVEN** the Lambda is deployed with the refactored handler
- **WHEN** an API Gateway event arrives with a valid push request
- **THEN** the behavior is identical to the current implementation (Tailscale proxy, validation, push, response)

#### Scenario: Health check

- **GIVEN** the dev server is running
- **WHEN** a `GET /health` request is sent
- **THEN** the server returns HTTP 200 with `{ status: "ok" }`

#### Scenario: Invalid request locally

- **GIVEN** the dev server is running
- **WHEN** a request with missing credentials is sent
- **THEN** the server returns HTTP 400 with `{ error: "Invalid request: check KRD and credentials" }`

#### Scenario: Auth failure locally

- **GIVEN** the dev server is running
- **WHEN** a push request with wrong Garmin credentials is sent
- **THEN** the server returns HTTP 401 with `{ error: "Garmin authentication failed" }`

#### Scenario: Oversized payload

- **GIVEN** the dev server is running
- **WHEN** a request body exceeding 512KB is sent
- **THEN** the server returns HTTP 413 with `{ error: "Payload too large" }`

#### Scenario: Tailscale tunnel unavailable

- **GIVEN** the Lambda handler is deployed with Tailscale middleware
- **WHEN** the Tailscale tunnel health check fails
- **THEN** the handler returns HTTP 503 with `{ error: "Proxy tunnel unavailable" }` before attempting the Garmin push

#### Scenario: Middleware execution order

- **GIVEN** a Hono app created with an `onBeforeRoute` middleware
- **WHEN** a POST `/` request arrives
- **THEN** the middleware executes before the route handler
