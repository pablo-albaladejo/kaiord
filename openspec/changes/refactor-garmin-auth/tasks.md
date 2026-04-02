# Tasks: Refactor Garmin Auth Provider

> All changes are **adapter-scoped** (`@kaiord/garmin-connect`). No domain, port, or application layer changes.

## 1. TokenManager (adapters/token/)

- [x] Create `token-manager.ts` with `createTokenManager(options: { refreshFn, logger, tokenStore? })`
- [x] Implement token generation counter (increments on `setTokens` and `refresh`)
- [x] Implement `setTokens` with best-effort auto-persist to `TokenStore`
- [x] Implement `refresh` with subscriber pattern, delegating to injected `refreshFn`
- [x] Implement `refresh` guard: throw `ServiceApiError` if no OAuth1 token
- [x] Implement `clearTokens`: null all references synchronously, then clear store async
- [x] Implement `init` for auto-restore from `TokenStore` (idempotent: no-op if tokens already in memory; returns `{ restored: boolean }`)
- [x] Implement `isAuthenticated` with expiry check (`expires_at > now`)
- [x] Define `TokenReader` type: `Pick<TokenManager, 'getAccessToken' | 'getGeneration' | 'refresh' | 'isAuthenticated'>`
- [x] Add `token-manager.test.ts`:
  - State encapsulation (no public mutable state)
  - Token generation increments on setTokens and refresh
  - Auto-persist on setTokens, refresh, restore
  - Best-effort persistence (save failure logged, not propagated)
  - Concurrent refresh (subscriber pattern, single refreshFn call)
  - Concurrent refresh with generation check (second caller skips if generation changed)
  - init() with valid tokens, expired tokens (warning), empty store
  - init() idempotent: no-op if tokens in memory
  - Concurrent init() calls do not corrupt state
  - clearTokens() nulls memory synchronously + clears store
  - refresh() without tokens throws ServiceApiError
  - isAuthenticated() with valid/expired/no tokens
  - Token values never appear in logger mock calls

## 2. Retry Wrapper (adapters/http/)

- [x] Create `retry.ts` with `withRetry(fetchFn, options?): FetchFn`
- [x] Accept injectable `randomFn` (default `Math.random`) for deterministic testing
- [x] Full jitter algorithm: `randomFn() * Math.min(maxDelay, baseDelay * 2^attempt)`
- [x] Retryable: HTTP 429, 5xx, TypeError (network error)
- [x] Non-retryable: all other 4xx (including 401 — passes through to authFetch)
- [x] Log each retry attempt at debug level (attempt number, delay, status/error)
- [x] Add `retry.test.ts`:
  - Retry on 429, 500, 503 with correct attempt count
  - No retry on 400, 401, 403, 404
  - Retry on TypeError (network error)
  - Respects maxRetries limit
  - Delay calculation with injected randomFn (deterministic)
  - Logger.debug called with attempt info on each retry
  - Successful response after transient failure is returned correctly

## 3. Auth Provider Refactor (adapters/auth/)

- [x] Refactor `garmin-auth-provider.ts`:
  - Accept `TokenManager` as dependency (not create httpClient)
  - Accept `fetchFn` as injected dependency, default `createCookieFetch()`
  - `login()` uses raw fetchFn for SSO flow (no retry), then calls `TokenManager.setTokens()`
  - `logout()` calls `TokenManager.clearTokens()`
  - `export_tokens()` reads from `TokenManager`
  - `restore_tokens()` calls `TokenManager.setTokens()`
  - `is_authenticated()` (snake_case, matching port) delegates to `TokenManager.isAuthenticated()`
- [x] Remove `GarminAuthProviderResult` type (no longer returns httpClient)
- [x] Fully decouple from `token-refresh.ts` (must not import it)
- [x] Update `garmin-auth-provider.test.ts`

## 4. HTTP Client Refactor (adapters/http/)

- [x] Refactor `garmin-http-client.ts`:
  - Accept `TokenReader` (narrowed type) instead of full `TokenManager`
  - Remove `setTokens`, `clearTokens`, `getOAuth2Token` from `GarminHttpClient` type
  - Keep `get`, `post`, `del` methods
- [x] Refactor `garmin-auth-fetch.ts`:
  - Record token generation before each request
  - On 401: compare recorded generation vs current; skip refresh if changed
  - Use `TokenReader.getAccessToken()` for Authorization header
  - Use `TokenReader.refresh()` only when generation matches (genuine stale token)
- [x] Add `garmin-auth-fetch.test.ts`:
  - 401 with stale generation triggers refresh + retry
  - 401 with changed generation skips refresh, retries with new token
  - Expired token triggers refresh before request
  - Non-401 errors pass through
- [x] Delete `token-refresh.ts` (safe: Task 3 removed all imports first)
- [x] Update `garmin-http-client.test.ts`
- [x] Update `adapters/http/types.ts` — clean `GarminHttpClient` type (remove token mutation methods)

## 5. Client Factory Refactor (adapters/client/)

- [x] Refactor `createGarminConnectClient`:
  - Stays synchronous, returns named `GarminConnectClient` type
  - Build `refreshFn` closure (with OAuthConsumer caching + retry-on-failure invalidation)
  - Build two fetch paths: `rawFetchFn` for auth, `retryFetchFn` for API
  - Wire: TokenManager → AuthProvider (raw fetch) + HttpClient (retry fetch) + WorkoutService
  - `init()` delegates to `TokenManager.init()`, returns `{ restored: boolean }`
- [x] Define and export `GarminConnectClient` type
- [x] Define and export `InitResult` type
- [x] New options type: `{ logger?, tokenStore?, fetchFn?, retry?: RetryOptions }`

## 6. Public API & Exports (index.ts)

- [x] Update `index.ts` exports:
  - Export `GarminConnectClient` and `InitResult` types
  - Update `createGarminAuthProvider` export (new signature)
  - Update `createGarminConnectClient` export
  - Export `RetryOptions` type
  - Export `createTokenManager` (advanced usage)
  - Export `TokenReader` type
  - Remove `GarminHttpClient` from public exports (internal only)
  - Remove `GarminAuthProviderResult` export
- [x] Confirm `createGarminWorkoutService` is NOT exported (internal only, created via factory)

## 7. Integration & Consumer Verification

- [x] Update `index.integration.test.ts` to work with new API (use `init()`, check `{ restored }`)
- [x] Verify CLI (`@kaiord/cli`):
  - `grep` for `createGarminConnectClient` / `createGarminAuthProvider` usage
  - Update call sites to new API (add `await client.init()` where tokenStore is used)
  - Smoke test: `kaiord garmin list` (if command exists)
- [x] Verify MCP (`@kaiord/mcp`):
  - `grep` for garmin client usage in MCP tools
  - Update call sites to new API
  - Run MCP test suite: `pnpm --filter @kaiord/mcp test`
- [x] Verify SPA (`@kaiord/workout-spa-editor`):
  - `grep` for garmin client usage
  - Update call sites (note: SPA uses Lambda proxy, may not use auth directly)
  - Run frontend tests: `pnpm --filter @kaiord/workout-spa-editor test`
  - Run e2e: check garmin push flow in e2e suite
- [x] Remove unused exports and dead code across package

## 8. Finalize

- [x] Run `pnpm -r build && pnpm -r test && pnpm lint:fix`
- [x] Add changeset with **major** bump: `pnpm exec changeset` (select `@kaiord/garmin-connect` as major)
- [x] Update `packages/garmin-connect/README.md` with migration guide (before/after from design.md)
- [x] Add JSDoc `@example` to `createGarminConnectClient` showing correct `await client.init()` usage
- [x] Update MCP tool descriptions if they reference old API
