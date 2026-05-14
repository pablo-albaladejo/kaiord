<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/http

HTTP infrastructure: SSO authentication flow, retry logic, OAuth signing, token injection, Garmin API URLs, validators.

**Files:**

**Core HTTP:**

- `garmin-http-client.ts` — GarminHttpClient factory (get/post/del with token injection)
- `garmin-auth-fetch.ts` — Auth fetch wrapper (injects OAuth2 access token via Authorization header)
- `retry.ts` — Exponential backoff retry wrapper; retries on 5xx, 429; gives up on 4xx auth

**SSO Flow (4 steps):**

- `garmin-sso.ts` — Entry point: orchestrates OAuth consumer → login ticket → OAuth1 → OAuth2
- `oauth-consumer.ts` — Step 1: fetch OAuth1 consumer key/secret from Garmin
- `sso-login.ts` — Step 2: submit email/password, get login ticket via HTML form
- `sso-oauth.ts` — Step 3: exchange ticket for OAuth1 token; Step 4: exchange OAuth1 for OAuth2
- `oauth-signer.ts` — OAuth1 signature generation (HMAC-SHA1)

**Validation & Config:**

- `sso-validators.ts` — Parse HTML responses (login ticket extraction, token JSON parsing)
- `sso-html-diagnostics.ts` — Extract error messages from SSO failure HTML
- `cookie-fetch.ts` — Cookie-aware fetch wrapper using fetch-cookie (Node.js)
- `urls.ts` — Garmin API endpoint constants
- `types.ts` — FetchFn, OAuth1Token, OAuth2Token, GarminHttpClient interfaces

**Test helpers:**

- `*.test.ts` files test SSO steps, validators, OAuth signing, retry logic

**Key patterns:**

- All fetch calls go through `fetchFn` parameter; can be mocked for tests
- OAuth1 signing via HMAC-SHA1; used only for token exchange, not API requests
- OAuth2 access token injected into every API request; auto-refreshed on 401
- Retry logic: linear backoff with jitter; respects max retries and delays
- Validators extract typed data from HTML/JSON responses; throw if parse fails

**SSO security notes:**

- Ticket obtained via form submission; not a JWT
- OAuth1 used once to get OAuth2; OAuth1 stored in token manager for refresh
- OAuth2 access token is bearer token for all subsequent API calls
- Token refresh obtained by re-exchanging stored OAuth1

<!-- MANUAL: -->
