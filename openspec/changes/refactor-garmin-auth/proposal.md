# Proposal: Refactor Garmin Auth Provider

## Problem

The `@kaiord/garmin-connect` auth system has several design issues:

1. **Tight coupling**: `createGarminAuthProvider` creates both `AuthProvider` and `GarminHttpClient`, entangling authentication with HTTP transport.
2. **Shared mutable state**: `TokenRefreshManager.state` is a public mutable object mutated by both auth provider and HTTP client with no encapsulation.
3. **No resilience**: No retry/backoff on any HTTP call (auth or API). A single 429 or transient failure kills the entire flow.
4. **Token lifecycle gaps**: Token refresh does not persist to `TokenStore`. No auto-restore from store on client creation. Expired tokens can be restored without validation.
5. **Hardcoded dependencies**: `createCookieFetch` is called directly inside the auth provider instead of being injected.

## Solution

Redesign the auth layer around four clearly separated concerns:

1. **TokenManager** — pure state + persistence. Encapsulates token state (OAuth1, OAuth2) behind a closed API. Delegates refresh to an injected `refreshFn` (closure). Persists to `TokenStore` on every mutation (best-effort — failures are logged, not propagated). Includes a token generation counter to prevent redundant concurrent refreshes.
2. **AuthProvider** — implements the core `AuthProvider` port. Delegates all token state to `TokenManager`. Accepts `fetchFn` as injected dependency. The SSO login flow uses **raw fetchFn without retry** to avoid retrying credential submissions.
3. **GarminHttpClient** — receives a `TokenReader` (narrowed type from TokenManager) for read-only token access and refresh triggering. No longer exposes token mutation methods. Uses token generation to detect stale-token 401s vs. genuine auth failures.
4. **Retry wrapper** — composable `withRetry(fetchFn)` at the transport layer. Applied to API calls only, NOT to the SSO login flow. Auth refresh is explicitly outside retry scope.

### Auto-Restore Strategy

`createGarminConnectClient` remains **synchronous**. An optional `await client.init()` method performs auto-restore from `TokenStore` and returns `{ restored: boolean }`. This avoids forcing all consumers to handle async construction.

## Affected Packages

| Package                  | Why                                                        |
| ------------------------ | ---------------------------------------------------------- |
| `@kaiord/garmin-connect` | Auth provider, HTTP client, token refresh — all refactored |
| `@kaiord/core`           | No changes (ports remain stable)                           |

This change is entirely **adapter-scoped**. No domain, port, or application layer changes.

## Breaking Changes

- `createGarminAuthProvider` — new signature and return type
- `createGarminConnectClient` — new options shape, adds `init()` method, returns named `GarminConnectClient` type
- `GarminHttpClient` — internal type; removes `setTokens`/`clearTokens`/`getOAuth2Token`

This is a published npm package. The changeset MUST use a **major** version bump.

## Constraints

- Architecture layer(s): **adapters only** (garmin-connect package)
- Core ports (`AuthProvider`, `TokenStore`, `WorkoutService`) remain unchanged
- No new external dependencies
- Token values (access_token, oauth_token_secret, refresh_token) SHALL NOT appear in log messages at any level
