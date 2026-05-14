<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters

Hexagonal adapter layer: HTTP client, token management, authentication, schema validation, and mappers. All exports from `index.ts` originate here.

**Subdirectories:** auth, client, http, token, token-store, schemas, mappers

**Key invariants:**

- Depends on `@kaiord/core` and `@kaiord/garmin` only
- Fetch function injected; HTTP client is a thin wrapper around it
- Token manager is the source of truth for auth state; all HTTP requests consume tokens via TokenReader interface
- All Garmin API responses validated with Zod before use

<!-- MANUAL: -->
