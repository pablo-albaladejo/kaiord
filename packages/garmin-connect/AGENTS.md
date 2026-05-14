<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/garmin-connect

## Purpose

Garmin Connect HTTP client: SSO authentication, token management, and workout push/pull/list/remove via Garmin's web API. **Not a format adapter** — it produces/consumes GCN (Garmin Connect Network) payloads over HTTP using strategies from `@kaiord/garmin` for serialization.

Key role: bridge between CLI, extensions (garmin-bridge, train2go-bridge), and Garmin Connect's REST API.

## Key Files

- **`src/index.ts`** - Public API exports (client factory, auth, token stores, cookie fetch)
- **`src/adapters/client/garmin-connect-client.ts`** - High-level client factory with auth + service + init
- **`src/adapters/client/garmin-workout-service.ts`** - Workout CRUD (push/pull/list/remove with KRD serialization)
- **`src/adapters/auth/garmin-auth-provider.ts`** - AuthProvider interface: login, export/restore tokens, logout
- **`src/adapters/http/garmin-sso.ts`** - 4-step SSO flow (OAuth consumer → login ticket → OAuth1 → OAuth2)
- **`src/adapters/token/token-manager.ts`** - Token state machine with refresh, persistence, generation tracking
- **`src/adapters/http/garmin-http-client.ts`** - Authenticated HTTP client (get/post/del) with token injection
- **`src/adapters/http/retry.ts`** - Exponential backoff retry wrapper for transient failures

## Subdirectories

| Directory                  | Purpose                                                          | Files |
| -------------------------- | ---------------------------------------------------------------- | ----- |
| `src/adapters/auth`        | AuthProvider implementation (login, token export/restore/logout) | 1     |
| `src/adapters/client`      | Client factory, workout service, refresh helpers                 | 6     |
| `src/adapters/http`        | SSO flow, HTTP client, retry, OAuth signing, validators          | 11    |
| `src/adapters/token`       | Token state machine, helpers, type defs                          | 3     |
| `src/adapters/token-store` | File and memory token stores                                     | 2     |
| `src/adapters/schemas`     | Zod validators for GCN responses and tokens                      | 2     |
| `src/adapters/mappers`     | Simple GCN → KRD model mappers                                   | 1     |
| `src/test-utils`           | Test constants (TTLs, timeouts)                                  | 1     |

## For AI Agents

### Working in This Directory

1. **Understand the flow**: Client factory → Token manager (state + store + refresh) → Auth provider (SSO) → HTTP client (retry + OAuth2 inject)
2. **Token lifecycle**: Login → SSO → store → auto-refresh on 401 → export/restore on demand → logout
3. **HTTP patterns**: All requests inject OAuth2 access token via `Authorization: Bearer`; retry wraps raw fetch; token manager handles refresh transparently
4. **KRD integration**: Workout service uses `@kaiord/garmin` reader/writer for serialization; workouts are always exchanged as KRD internally, serialized to GCN JSON for Garmin API
5. **Error strategy**: Typed errors from `@kaiord/core` (ServiceAuthError, ServiceApiError); SSO failures detail HTML diagnostics
6. **Testing**: Vitest with integration config; mock fetch, token stores, and HTTP responses; test constants in `test-utils/`

### Testing Requirements

- **Unit tests**: Token manager state, refresh logic, auth provider, retry logic, SSO validators
- **Integration tests**: Full SSO flow (mocked HTTP), token persistence roundtrips, workout push/pull with serialization
- **Test conventions** (enforced by ESLint + pre-commit):
  - `it()` titles must start with `"should "` (lowercase)
  - Bodies must contain `// Arrange`, `// Act`, `// Assert` comments (Pascal-case, separated by blank lines)
- **No E2E against live Garmin API** — use mocked fetch
- **Round-trip tolerance**: Token refresh should not lose state; push/pull should preserve workout structure (±1s time, ±1W power)

### Common Patterns

**Creating a client with token persistence:**

```typescript
const client = createGarminConnectClient({
  tokenStore: createFileTokenStore(),
  retry: { maxRetries: 3, baseDelay: 1000 },
});
const { restored } = await client.init();
if (!restored) await client.auth.login(email, password);
```

**Token refresh (automatic):**

- HTTP client detects 401 → token manager calls refresh function → OAuth2 re-exchange → retry request

**Workout push/pull:**

- `client.service.push(krd)` → serialize to GCN JSON → POST to `/workout` → parse response
- `client.service.pull(id)` → GET from `/workout/{id}` → parse GCN JSON → deserialize to KRD

**Extending with custom fetch:**

```typescript
const client = createGarminConnectClient({
  fetchFn: customFetch, // must support cookies across requests
});
```

## Dependencies

### Internal

- **`@kaiord/core`** - Domain types (KRD, Logger, AuthProvider, WorkoutService, TokenStore), errors, utilities (toText, createConsoleLogger)
- **`@kaiord/garmin`** - GCN reader/writer for serialization; schemas

### External

- **`fetch-cookie`** (^3.2.0) - Cookie persistence for SSO flow
- **`oauth-1.0a`** (^2.2.6) - OAuth1 signing for token exchange
- **`zod`** (^4.4.3) - Schema validation (tokens, workout responses)

## Quality Standards

- ✅ **Zero TypeScript errors** — strict mode, no implicit `any`
- ✅ **Zero ESLint warnings** — all rules enforced
- ✅ **Zero test warnings** — clean vitest output
- ✅ **≥80% coverage** — core: token manager, auth, retry; HTTP: SSO, validators
- ✅ **100% test pass rate**
- ✅ **Max 100 lines/file**, **max 40 lines/function** (clients up to 60)
- ✅ **Schemas use camelCase** (adapter convention) in validators; domain types use snake_case
- ✅ **No dual imports** — format adapters isolated; auth logic separate from HTTP

<!-- MANUAL: -->

### Architecture Decisions

- **Token manager as state machine**: Avoids race conditions during token refresh; generation tracking prevents stale token reads
- **Configurable fetch**: Allows custom implementations (Node.js cookie handling, browser fetch, fetch-mock for tests)
- **Retry wrapper over raw fetch**: Transient failures (5xx, rate limits) auto-retry with exponential backoff; permanent errors (4xx auth) surface immediately
- **Two-tier auth**: OAuth1 for token exchange, OAuth2 for API requests; OAuth1 obtained via SSO form submission
- **Best-effort persistence**: Token store failures don't crash the client; logged but non-blocking

### Common Gotchas

- **Cookie state across SSO**: fetch function must persist cookies across the 4-step SSO flow; use `fetch-cookie` wrapper or equivalent
- **401 handling**: HTTP client auto-refreshes on 401; if refresh fails, subsequent requests fail with ServiceAuthError
- **Token export timing**: Export only returns tokens if both oauth1 and oauth2 are present; throws if missing
- **File token store paths**: Defaults to `~/.kaiord/garmin-tokens.json`; ensure write permissions
