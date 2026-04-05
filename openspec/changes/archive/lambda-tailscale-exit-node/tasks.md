# Tasks: Lambda Tailscale exit node routing

## 1. Tailscale CDK construct setup

- [x] 1.1 Install `tailscale-lambda-extension` npm package in `packages/infra`
- [x] 1.2 Install `fetch-socks` + `undici` npm packages (replaced `socks-proxy-agent` — see SOLUTION.md)

## 2. CDK Stack changes

- [x] 2.1 Add `TailscaleLambdaExtension` construct to the stack
- [x] 2.2 Create Secrets Manager secret for Tailscale API key (or reference existing)
- [x] 2.3 Add `TS_SECRET_API_KEY` env var (secret name, not value)
- [x] 2.4 Add `TS_EXIT_NODE` env var (exit node hostname)
- [x] 2.5 Increase memory from 256 to 512 MB
- [x] 2.6 Increase timeout from 30 to 60 seconds
- [x] 2.7 ~~Set reserved concurrency to 5~~ — Removed: account quota too low (10). Increase to 1000 requested.
- [x] 2.8 Keep `minify: false` and `sourceMap: true`

## 3. Lambda handler changes

- [x] 3.1 Create `packages/infra/src/lambda/proxy-fetch.ts` — `fetch-socks` + `setGlobalDispatcher`
- [x] 3.2 Add tunnel health check with 3 retries and 2s delay
- [x] 3.3 Update `garmin-push.ts` — uses default `createCookieFetch()` (no custom fetchFn needed)
- [x] 3.4 Update `handler.ts` with 503 response for tunnel unavailable
- [x] 3.5 Add `errorMessage` to error logging (truncated to 100 chars)
- [x] 3.6 Add `isRateLimited` error classification for 429 responses
- [x] 3.7 Create `tailscale-exit-node.ts` — configures exit node + waits for online

## 4. Tailscale admin configuration (manual)

- [x] 4.1 Create Tailscale auth key for Lambda (ephemeral, reusable, `tag:lambda`, 90-day expiry)
- [x] 4.2 Store auth key in AWS Secrets Manager as `tailscale-api-key`
- [x] 4.3 ~~Configure Tailscale ACLs~~ — Pending: tag:lambda created, ACL restriction not yet applied
- [x] 4.4 Verify Raspberry Pi exit node is advertised and approved

## 5. Deploy workflow

- [x] 5.1 Update `deploy-infra.yml` to pass `TS_EXIT_NODE` as CDK context (uses secret)
- [x] 5.2 Add `TS_SECRET_NAME` to GitHub repository variables

## 6. Tests

- [x] 6.1 Unit test `proxy-fetch.ts` — enableSocksProxy + checkTunnelHealth (5 tests)
- [x] 6.2 Unit test handler 503 response when tunnel unavailable
- [x] 6.3 Unit test handler 429 rate limit response
- [x] 6.4 Unit test handler 400 precedence over 503 (regression)
- [x] 6.5 Unit test `tailscale-exit-node.ts` — ensureExitNode (4 tests)
- [x] 6.6 Integration test: deploy to AWS and verify push succeeds — **VERIFIED** (workout 1525451643 created)
- [x] 6.7 Verify DNS resolution of Garmin domains through tunnel — works via exit node

## 7. Documentation

- [x] 7.1 Create `SOLUTION.md` with full architecture, debugging timeline, and rationale
- [x] 7.2 Document auth key rotation (90-day expiry, Secrets Manager update procedure)
- [x] 7.3 Document Tailscale ACL requirements for `tag:lambda`
- [x] 7.4 Document cold start expectations (5-10s overhead)
- [x] 7.5 Document fork plan for OAuth client key support (`fork-tailscale-extension/`)

## 8. Changeset

- [x] 8.1 ~~Create changeset~~ — shipped via multiple PRs (#201, #205, #207, #209, #211, #212, #214, #215)
