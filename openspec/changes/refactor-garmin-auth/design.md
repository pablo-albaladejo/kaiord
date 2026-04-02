# Design: Refactor Garmin Auth Provider

## Architecture

All changes are in the **adapter layer** (`@kaiord/garmin-connect`). Core ports remain unchanged.

```text
@kaiord/core (ports — unchanged)
├── AuthProvider
├── TokenStore
└── WorkoutService

@kaiord/garmin-connect (adapters — refactored)
├── adapters/token/
│   └── token-manager.ts          # NEW: state + persistence (no I/O)
├── adapters/auth/
│   └── garmin-auth-provider.ts   # REFACTORED: uses TokenManager
├── adapters/http/
│   ├── garmin-http-client.ts     # REFACTORED: receives TokenReader
│   ├── retry.ts                  # NEW: withRetry wrapper
│   ├── garmin-auth-fetch.ts      # REFACTORED: token generation check
│   └── token-refresh.ts          # REMOVED: split into TokenManager + refreshFn closure
├── adapters/client/
│   └── garmin-connect-client.ts  # REFACTORED: two fetch paths + init()
└── index.ts                      # UPDATED: new exports + named types
```

## Decision 1: Separate TokenManager (State) from Refresh (I/O)

**Layer**: adapter

**Decision**: `TokenManager` is pure state + persistence. The refresh network I/O is an injected `refreshFn` closure.

**TokenManager API**:

```ts
type TokenManager = {
  getAccessToken: () => string | undefined;
  getOAuth1Token: () => OAuth1Token | undefined;
  getOAuth2Token: () => OAuth2Token | undefined;
  getGeneration: () => number;
  isAuthenticated: () => boolean;
  setTokens: (oauth1: OAuth1Token, oauth2: OAuth2Token) => Promise<void>;
  clearTokens: () => Promise<void>;
  refresh: () => Promise<void>;
  init: () => Promise<{ restored: boolean }>;
};
```

**TokenReader** (narrowed type for HttpClient):

```ts
type TokenReader = Pick<
  TokenManager,
  "getAccessToken" | "getGeneration" | "refresh" | "isAuthenticated"
>;
```

**Factory signature**:

```ts
type RefreshFn = (oauth1: OAuth1Token) => Promise<OAuth2Token>;

const createTokenManager = (options: {
  refreshFn: RefreshFn;
  logger: Logger;
  tokenStore?: TokenStore;
}) => TokenManager;
```

**`refreshFn` is built by the client factory as a closure**:

```ts
const refreshFn: RefreshFn = (() => {
  let consumer: OAuthConsumer | undefined;
  return async (oauth1: OAuth1Token) => {
    try {
      consumer ??= await fetchOAuthConsumer(fetchFn);
      return await exchangeOAuth2(oauth1, consumer, fetchFn);
    } catch (error) {
      // Clear cached consumer and retry once
      consumer = undefined;
      consumer = await fetchOAuthConsumer(fetchFn);
      return exchangeOAuth2(oauth1, consumer, fetchFn);
    }
  };
})();
```

This keeps OAuthConsumer caching inside the closure with retry-on-failure invalidation. Eliminates circular dependency risk: `TokenManager → RefreshFn (closure) → FetchFn`. No cycles.

**Token generation counter**: A monotonically increasing integer that increments on every `setTokens` or successful `refresh`. This enables `authFetch` to detect whether another caller already refreshed the token between request and 401 response, preventing redundant refresh calls.

**Rationale**: The previous design merged state and I/O in TokenManager, violating Single Responsibility. With injection, TokenManager tests use a fake `refreshFn`.

**Alternative considered**: Keep a separate `TokenRefresher` class. Rejected as over-engineering — a closure is simpler and achieves the same decoupling.

## Decision 2: Inject fetchFn, Default to Cookie Fetch

**Layer**: adapter

**Decision**: All factories accept an optional `fetchFn` parameter. Default is `createCookieFetch()`.

**Rationale**: The current code hardcodes `createCookieFetch()` inside `createGarminAuthProvider`. Injection allows testing with mocks and alternative implementations (e.g., Lambda proxy).

## Decision 3: Two Fetch Paths — SSO vs API

**Layer**: adapter (http)

**Decision**: The client factory creates two fetch paths from the base `fetchFn`:

```text
rawFetchFn = fetchFn ?? createCookieFetch()
retryFetchFn = options.retry ? withRetry(rawFetchFn, options.retry) : rawFetchFn

AuthProvider  → uses rawFetchFn (SSO login, no retry)
HttpClient    → uses retryFetchFn → authFetch layer on top
```

**Why two paths**:

- The SSO login flow POSTs credentials (username/password). Retrying credential submissions on 5xx could trigger Garmin account lockout.
- API calls (list/push workouts) are safe to retry on transient failures.
- The `refreshFn` closure also uses `rawFetchFn` (it calls SSO exchange endpoints).

**Retry wrapper**:

```ts
type RetryOptions = {
  maxRetries?: number;   // default 3
  baseDelay?: number;    // default 1000ms
  maxDelay?: number;     // default 10000ms
  randomFn?: () => number; // default Math.random, injectable for testing
};

const withRetry = (fetchFn: FetchFn, options?: RetryOptions): FetchFn;
```

**Full jitter algorithm**: `delay = randomFn() * Math.min(maxDelay, baseDelay * 2 ** attempt)`

**Retryable conditions**: HTTP 429, 5xx, `TypeError` (network failure). All other 4xx pass through immediately. 401 is NOT intercepted by retry — it passes through to `authFetch` which handles it via `TokenReader.refresh()`.

**Retry logging**: Each attempt is logged at debug level with attempt number, computed delay, and status/error.

## Decision 4: Sync Factory + Async init()

**Layer**: adapter (client factory)

**Decision**: `createGarminConnectClient()` stays synchronous. Returns named type `GarminConnectClient`:

```ts
type InitResult = { restored: boolean };

type GarminConnectClient = {
  auth: AuthProvider;
  service: GarminWorkoutClient;
  init: () => Promise<InitResult>;
};
```

```ts
const client = createGarminConnectClient({ tokenStore });
const { restored } = await client.init();
if (!restored) {
  await client.auth.login(email, password);
}
```

**Returning `{ restored: boolean }`** mitigates the footgun of calling `init()` without `await` — the meaningful return value makes consumers more likely to use the result.

**`init()` is idempotent**: if tokens are already in memory (e.g., after `login()`), `init()` is a no-op and returns `{ restored: false }`.

**Rationale**: Making the factory async would force every consumer (CLI, MCP, SPA) to await construction.

## Decision 5: Best-Effort Persistence

**Layer**: adapter (token)

**Decision**: `TokenStore.save()` failures are logged as warnings but never propagated. The in-memory token remains valid.

**Rationale**: Persistence is a convenience (session resumption). A failure to persist should not break an active session.

## Decision 6: Token Cleanup on Logout

**Layer**: adapter (token)

**Decision**: `clearTokens()` nulls all in-memory token references **synchronously** before clearing the `TokenStore` asynchronously. JavaScript cannot truly zero string memory, but ensuring no reference paths remain from `TokenManager` to token strings minimizes exposure in heap dumps.

**Rationale**: Relevant for long-running processes (Lambda proxy, MCP server) where token secrets could linger in memory.

## Decision 7: Major Version Bump

**Layer**: package

**Decision**: The changeset MUST specify a **major** bump for `@kaiord/garmin-connect`.

**Rationale**: Even without known external consumers, this is a published npm package. Semantic versioning requires a major bump for breaking API changes.

## Migration Guide

### Before (v5.x)

```ts
// Old: auth provider returns httpClient
const { auth, httpClient } = createGarminAuthProvider({ logger });
const service = createGarminWorkoutService(httpClient, logger);
await auth.login(email, password);

// Old: client factory
const { auth, service } = createGarminConnectClient();
await auth.login(email, password);
```

### After (v6.x)

```ts
// New: use client factory (recommended)
const client = createGarminConnectClient({
  logger,
  tokenStore: createFileTokenStore(),
  retry: { maxRetries: 3 },
});
const { restored } = await client.init(); // auto-restore from store
if (!restored) {
  await client.auth.login(email, password);
}

// New: auth provider is auth-only (advanced usage)
const tokenManager = createTokenManager({ refreshFn, logger, tokenStore });
const auth = createGarminAuthProvider({ tokenManager, logger });
await auth.login(email, password);
```

### Key Differences

| Aspect                       | v5.x   | v6.x                        |
| ---------------------------- | ------ | --------------------------- |
| Auth returns httpClient      | Yes    | No — use client factory     |
| Token persistence on refresh | No     | Automatic (best-effort)     |
| Auto-restore from store      | Manual | `await client.init()`       |
| Retry on API calls           | No     | Optional via `retry` option |
| `GarminHttpClient` public    | Yes    | Internal only               |

## Dependencies

No new external dependencies. `fetch-cookie` and `oauth-1.0a` remain.

## Future Considerations

- **Per-request timeouts**: `AbortSignal.timeout()` is not in scope but should be considered in a follow-up.
- **OAuthConsumer rotation**: The consumer key is cached with retry-on-failure invalidation, but has no TTL.
