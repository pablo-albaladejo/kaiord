---
"@kaiord/garmin-connect": major
---

Redesign Garmin auth provider with separated concerns

- **TokenManager**: encapsulated token state with generation counter, best-effort persistence, and subscriber-pattern concurrent refresh
- **Retry wrapper**: `withRetry(fetchFn)` with exponential backoff and full jitter for transient failures (429, 5xx, network errors)
- **Two fetch paths**: raw fetch for SSO login (no retry), retry-wrapped fetch for API calls
- **Auth provider decoupled**: no longer creates/returns HTTP client; accepts TokenManager as dependency
- **HTTP client refactored**: receives narrowed `TokenReader` type; uses token generation to prevent redundant refreshes on concurrent 401s
- **Client factory**: sync `createGarminConnectClient()` with `await client.init()` for token auto-restore; returns named `GarminConnectClient` type

BREAKING: `createGarminAuthProvider` signature changed, `createGarminConnectClient` returns new shape, `GarminHttpClient` no longer public.
