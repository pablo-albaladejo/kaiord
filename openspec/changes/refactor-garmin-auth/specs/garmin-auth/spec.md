# Spec: Garmin Auth Provider

## Cross-Cutting Requirements

Token values (`access_token`, `oauth_token_secret`, `refresh_token`) SHALL NOT appear in log messages at any level. Logger calls MUST sanitize or omit token data.

## Requirements

### TOKEN-MANAGER — Token State Encapsulation

TokenManager SHALL encapsulate all token state (OAuth1, OAuth2) behind a closed API. This is a Garmin-specific adapter type, not a generic port.

TokenManager MUST maintain a **token generation counter** (monotonically increasing integer). The counter MUST increment on every `setTokens` or `refresh` call. This enables consumers (e.g., authFetch) to detect whether tokens have changed between request and response.

TokenManager MUST persist tokens to `TokenStore` (if provided) after every state mutation (login, refresh, restore). Persistence SHALL be **best-effort**: if `save()` throws, the error MUST be logged as a warning but NOT propagated. The in-memory token remains valid.

TokenManager MUST validate token expiry on restore and log a warning if tokens are expired. Expired tokens SHALL still be restored (the next API call will trigger a refresh).

TokenManager SHALL expose a read-only accessor for the current OAuth2 access token and the current token generation (used by HTTP client).

TokenManager SHALL accept a `refreshFn` (injected closure) for performing token refresh. TokenManager MUST NOT perform network I/O directly — refresh network logic lives in the closure.

TokenManager SHALL implement the subscriber pattern for concurrent refresh: if multiple callers trigger `refresh()` simultaneously, only one refresh executes and all callers receive the result.

`refresh()` SHALL throw `ServiceApiError` if no OAuth1 token is available (e.g., after `clearTokens()`). It MUST NOT call `refreshFn` without a valid OAuth1 token.

`isAuthenticated()` SHALL return `true` only if an OAuth2 token exists AND its `expires_at` is in the future.

`clearTokens()` SHALL null all token references synchronously (OAuth1, OAuth2) and then clear the `TokenStore` asynchronously. After `clearTokens()`, no reference path from TokenManager SHALL reach any token string.

`init()` SHALL be idempotent: if tokens are already present in memory, `init()` SHALL be a no-op (do not overwrite an active session with stale store data).

**Scenarios:**

```gherkin
Given a TokenManager with a FileTokenStore
When a token refresh completes successfully
Then the refreshed tokens MUST be persisted to the store
And the token generation counter MUST increment

Given a TokenManager with a FileTokenStore
When persistence fails after a successful refresh
Then the error MUST be logged as warning
And the in-memory token MUST remain valid
And the error MUST NOT propagate to the caller

Given a TokenManager with a TokenStore containing valid tokens
When init() is called
Then tokens SHALL be loaded and restored automatically
And init() SHALL return { restored: true }

Given a TokenManager with a TokenStore containing expired tokens
When init() is called
Then tokens SHALL be restored and a warning logged
And isAuthenticated() SHALL return false
And init() SHALL return { restored: true }

Given a TokenManager with an empty TokenStore
When init() is called
Then isAuthenticated() SHALL return false (login required)
And init() SHALL return { restored: false }

Given a TokenManager with valid in-memory tokens
When init() is called again
Then it SHALL be a no-op (do not overwrite active session)
And init() SHALL return { restored: false }

Given two concurrent callers triggering refresh()
When the first refresh is in progress
Then the second caller SHALL wait for the first result
And only one network call SHALL be made

Given two concurrent requests where the first triggers a refresh
When the second also gets 401 with a stale token generation
Then it SHALL check the current generation against its stale generation
And if the generation has changed, skip refresh and use the new token
And if the generation matches, trigger refresh normally

Given a TokenManager with no tokens (after clearTokens)
When refresh() is called
Then it SHALL throw ServiceApiError without calling refreshFn

Given a TokenManager with tokens
When clearTokens() is called (logout)
Then all token references MUST be nulled synchronously
And TokenStore MUST be cleared asynchronously
And isAuthenticated() SHALL return false immediately

Given a TokenManager with a valid OAuth2 token
When isAuthenticated() is called
Then it SHALL return true

Given a TokenManager with an expired OAuth2 token
When isAuthenticated() is called
Then it SHALL return false

Given two concurrent init() calls
When both execute simultaneously
Then state SHALL not be corrupted (idempotent)
```

### TOKEN-MANAGER-FACTORY — Construction Dependencies

`createTokenManager` SHALL accept: `refreshFn`, `logger`, and optional `tokenStore`.

`refreshFn` is a closure of type `(oauth1: OAuth1Token) => Promise<OAuth2Token>` that encapsulates the SSO exchange logic and `fetchFn`. This avoids TokenManager depending on `FetchFn` directly and eliminates circular dependency risk.

The OAuthConsumer SHALL be fetched and cached inside the `refreshFn` closure, not in TokenManager. If a refresh fails, the closure SHOULD clear the cached consumer and retry once with a fresh consumer before propagating the error.

**Scenarios:**

```gherkin
Given a createTokenManager call with refreshFn and tokenStore
When the factory returns
Then the TokenManager SHALL NOT have performed any network I/O

Given a refreshFn that internally uses fetchOAuthConsumer
When refresh is called twice
Then the consumer SHALL be fetched once and cached in the closure

Given a refreshFn where refresh fails due to consumer rejection
When the closure retries with a fresh consumer
Then the consumer cache SHALL be cleared and re-fetched
```

### AUTH-PROVIDER — Decoupled Authentication

AuthProvider SHALL implement the `AuthProvider` port from `@kaiord/core`.

AuthProvider MUST NOT create or own the HTTP client.

AuthProvider SHALL delegate all token state management to `TokenManager`.

AuthProvider SHALL accept `fetchFn` as an injected dependency, defaulting to `createCookieFetch()`. The SSO login flow SHALL use the **raw fetchFn without retry wrapping** to avoid retrying credential submissions (which could trigger account lockout).

`logout()` SHALL call `TokenManager.clearTokens()` to clear both in-memory and persisted state.

`is_authenticated()` (snake_case, matching port definition) SHALL delegate to `TokenManager.isAuthenticated()`.

**Scenarios:**

```gherkin
Given an AuthProvider with injected fetchFn
When login is called
Then the SSO flow SHALL use the raw fetchFn (no retry wrapping)

Given an AuthProvider after successful login
When export_tokens is called
Then it SHALL return the current OAuth1+OAuth2 tokens via TokenManager

Given an authenticated AuthProvider
When logout is called
Then TokenManager.clearTokens() SHALL be called
And is_authenticated() SHALL return false
```

### HTTP-CLIENT — Token-Aware HTTP

GarminHttpClient SHALL receive a `TokenReader` (narrowed type: `Pick<TokenManager, 'getAccessToken' | 'getGeneration' | 'refresh' | 'isAuthenticated'>`) for token access and refresh triggering. This enforces read-only + refresh contract at the type level.

GarminHttpClient MUST NOT expose `setTokens`, `clearTokens`, or `getOAuth2Token` in its public type.

GarminHttpClient SHALL use `TokenReader.getAccessToken()` for Authorization headers.

GarminHttpClient SHALL use token generation to handle 401 responses:

1. Before each request, record the current token generation.
2. On 401, compare the recorded generation with the current generation.
3. If generation has changed (another caller already refreshed), retry with the new token — do NOT call refresh.
4. If generation matches, call `TokenReader.refresh()` and retry once.

**Scenarios:**

```gherkin
Given an authenticated HTTP client
When a request returns 401 and the token generation has not changed
Then the client SHALL trigger a token refresh via TokenReader and retry once

Given an authenticated HTTP client
When a request returns 401 but the token generation has changed
Then the client SHALL skip refresh and retry with the already-refreshed token

Given an HTTP client with expired tokens
When a request is made
Then the client SHALL call TokenReader.refresh() before sending the request
```

### RETRY — Resilient HTTP Calls

A `withRetry` higher-order function SHALL wrap `FetchFn` and return a new `FetchFn`.

**Composition**: The client factory SHALL maintain **two fetch paths**:

- **SSO login**: `cookieFetch` (raw, NO retry) — passed to AuthProvider
- **API calls**: `cookieFetch → withRetry` — passed to GarminHttpClient (which adds auth on top)

This ensures credential submissions are never retried, while API calls benefit from retry.

Retry SHALL apply to transient failures: HTTP 429, 5xx, and network errors (TypeError from fetch).

Retry MUST NOT retry on 4xx errors other than 429.

Retry MUST use exponential backoff with **full jitter**: `delay = randomFn() * min(maxDelay, baseDelay * 2^attempt)`. The `randomFn` defaults to `Math.random` but is injectable for deterministic testing.

Each retry attempt SHALL be logged at **debug** level with attempt number, delay, and HTTP status or error message.

Default configuration: 3 retries, base delay 1s, max delay 10s.

**Scenarios:**

```gherkin
Given an HTTP call that returns 429
When retry is enabled
Then the call SHALL be retried with exponential backoff and full jitter
And each retry attempt SHALL be logged at debug level

Given an HTTP call that returns 400
When retry is enabled
Then the call SHALL NOT be retried (client error, not transient)

Given an HTTP call that fails 3 times with 500
When max retries is 3
Then the call SHALL fail after the 3rd retry

Given a request where the underlying fetch returns 401
When retry is enabled
Then the retry wrapper SHALL NOT intercept 401 (authFetch handles it above)

Given a fetch that throws TypeError (network error)
When retry is enabled
Then the call SHALL be retried

Given a retry wrapper with injected randomFn returning 0.5
When calculating delay for attempt 2 with baseDelay 1000 and maxDelay 10000
Then the delay SHALL be 0.5 * min(10000, 1000 * 4) = 2000ms
```

### CLIENT-FACTORY — Simplified Creation

`createGarminConnectClient` SHALL remain **synchronous** and return a named `GarminConnectClient` type: `{ auth: AuthProvider, service: GarminWorkoutClient, init: () => Promise<InitResult> }`.

`InitResult` is `{ restored: boolean }` — making the result meaningful reduces the likelihood of forgetting `await`.

`init()` is an async method that performs auto-restore from `TokenStore` (if provided). Calling `init()` is optional — consumers who do not use token persistence can skip it. `init()` delegates to `TokenManager.init()`.

The factory SHALL accept options: `logger`, `tokenStore`, `fetchFn`, `retry`.

The factory SHALL build two fetch paths:

- `rawFetchFn` = `fetchFn ?? createCookieFetch()` — used by AuthProvider for SSO login
- `retryFetchFn` = `options.retry ? withRetry(rawFetchFn, options.retry) : rawFetchFn` — used by HttpClient for API calls

**Scenarios:**

```gherkin
Given a client created with tokenStore
When init() is called and the store contains valid tokens
Then the client SHALL be authenticated without calling login
And init() SHALL return { restored: true }

Given a client created with tokenStore
When init() is called and the store is empty
Then the client SHALL not be authenticated (login required)
And init() SHALL return { restored: false }

Given a client created without tokenStore
When init() is called
Then it SHALL be a no-op and return { restored: false }

Given a client created with retry options
When an API call is made
Then the underlying fetchFn SHALL have retry wrapping applied

Given a client created with retry options
When login() is called
Then the SSO flow SHALL use the raw fetchFn (no retry)
```

## Future Considerations

- **Per-request timeouts**: `AbortSignal.timeout()` is not in scope for this refactor but should be considered in a follow-up. Currently, a hanging request will never trigger a retry.
- **OAuthConsumer rotation**: The consumer key is cached in the `refreshFn` closure with no TTL. If Garmin rotates keys, the process must restart. The closure includes a retry-on-failure mitigation.
