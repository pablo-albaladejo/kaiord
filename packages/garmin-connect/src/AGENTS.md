<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src

## Purpose

Source tree of `@kaiord/garmin-connect` — the HTTP client for Garmin Connect.
Handles SSO authentication, token lifecycle, persistent token stores, and the
typed workout endpoints (push, list, delete). Produces/consumes GCN payloads
whose schema lives in `@kaiord/garmin`.

## Key Files

| File       | Description                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `index.ts` | Public surface — exports the client factory, auth provider factory, token store implementations, and typed errors. |

## Subdirectories

| Directory     | Purpose                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------- |
| `adapters/`   | Auth, HTTP, token, client, schema, and mapper implementations (see `adapters/AGENTS.md`) |
| `test-utils/` | Shared timing/HTTP constants and test helpers (see `test-utils/AGENTS.md`)               |

## For AI Agents

### Working In This Directory

- Network adapter — depends on `@kaiord/core` and `@kaiord/garmin` only.
- Auth state is single-writer: the token state machine in
  `adapters/token/` is the only place that mutates tokens. Other modules
  read from the store but never write directly.
- 401 responses MUST trigger ONE refresh attempt followed by a single
  retry; further 401s surface as `AuthError`.
- Public exports come through `index.ts`. Never expose `fetch-cookie`/
  `oauth-1.0a` types in the public API.

### Testing Requirements

Coverage target 80%. Vitest with mocked `fetch` (no real network). Title
rule and AAA rule apply. Token-state-machine transitions have dedicated
unit tests.

### Common Patterns

- Cookie-aware `fetch` via `fetch-cookie` wraps every HTTP call.
- Tokens are exported/restored as opaque JSON blobs — internal shape may
  change without breaking the API.
- Errors are typed (`AuthError`, `NetworkError`, `WorkoutPushError` …) so
  callers can pattern-match instead of string-matching.

## Dependencies

### Internal

- `@kaiord/core` — logger port, error base classes.
- `@kaiord/garmin` — GCN payload schemas.

### External

- `fetch-cookie` — stateful cookie jar.
- `oauth-1.0a` — Garmin's OAuth1 signing.
- `zod` — response validation.

<!-- MANUAL: -->
