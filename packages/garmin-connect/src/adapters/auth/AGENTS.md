<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/auth

AuthProvider implementation (interface from `@kaiord/core`): login, token export/restore, logout, authentication check.

**Files:**

- `garmin-auth-provider.ts` — Factory for AuthProvider; delegates SSO to HTTP layer, tokens to TokenManager

**Key types:**

- `AuthProvider` — login, is_authenticated, export_tokens, restore_tokens, logout
- `TokenManager` — injectable, provides token get/set/clear operations

**Patterns:**

- `createGarminAuthProvider(options)` returns an AuthProvider
- Login delegates to `garminSso()` from `../http/garmin-sso.ts`
- Token validation via Zod schema before export

<!-- MANUAL: -->
