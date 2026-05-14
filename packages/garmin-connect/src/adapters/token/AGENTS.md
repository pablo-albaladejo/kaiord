<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/token

Token state machine: in-memory storage, persistence layer integration, auto-refresh, generation tracking.

**Files:**

- `token-manager.ts` — Factory for TokenManager; wires state, refresh, persistence
- `token-manager.types.ts` — TokenManager, TokenReader, RefreshFn interfaces
- `token-manager.helpers.ts` — State helpers: refresh logic, expiration check, store integration

**Key interfaces:**

- `TokenManager` — getAccessToken, getOAuth1Token, getOAuth2Token, setTokens, clearTokens, refresh, init, isAuthenticated, getGeneration
- `TokenReader` — subset for HTTP client: getAccessToken, getGeneration (for token injection)
- `RefreshFn` — async function to obtain new OAuth2 token

**State machine:**

```
Initial: oauth1=undefined, oauth2=undefined, generation=0
On login: setTokens(oauth1, oauth2) → generation++, persist if store present
On refresh: calls refreshFn → new oauth2 → generation++, persist, return
On 401: auto-refresh via HTTP client → injects new token → retry
On logout: clearTokens → undefined, generation++, clear store
On init: restoreFromStore if tokenStore provided
```

**Key patterns:**

- **Generation tracking**: Used by HTTP client to detect stale token reads during concurrent requests
- **In-flight refresh**: Only one refresh in-flight at a time; waiting requests share the same promise
- **Persistence**: Best-effort; store failures logged but non-blocking
- **Expiration**: OAuth2 checked against `expires_at` timestamp before use
- **Thread-safe**: State guarded; refresh coalesced to prevent duplicate exchanges

**Testing:**

- Mock RefreshFn to simulate successful/failed exchanges
- Test generation increment on token changes
- Test store integration: set → persist → clear
- Test concurrent refresh scenarios

<!-- MANUAL: -->
