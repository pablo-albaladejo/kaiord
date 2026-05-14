<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/lib/`

## Purpose

Leaf libraries: small, focused, mostly-pure modules used across the SPA. No React, no Dexie, no top-level side effects.

## Key Files

### Runtime + config

- `runtime-config.ts` / `.test.ts` — reads `window.__KAIORD_CONFIG__` (the inline-script seam from `index.html`) — exposes `getCfAnalyticsToken()` and similar accessors.
- `provider-factory.ts` / `.test.ts`, `provider-models.ts` — AI-provider factory that maps `LlmProviderConfig` → a Vercel-AI-SDK language model instance.

### AI

- `generate-workout.ts` / `.test.ts` — AI generation entry used by the application layer.
- `ai-sdk-gateway-stub.ts` — local stub for the gateway (test seam).
- `zod-v3-stub.ts` — Zod v3 compatibility shim for AI SDK calls.

### Zone math

- `zone-method-types.ts` — `ZoneMethod` enum + result types.
- `zone-methods.ts` / `.test.ts` — top-level zone-math dispatcher.
- `hr-methods.ts` — HR zone math (LTHR-based).
- `power-methods.ts`, `power-methods-advanced.ts` — power zone math (FTP-based, advanced curves).
- `pace-methods.ts` — pace zone math (threshold-pace-based; mm:ss strings).

### Crypto + storage

- `crypto.ts` / `.test.ts` — AES-GCM encrypt/decrypt for Garmin creds.
- `secure-storage.ts` / `.test.ts` — keychain-style wrapper over crypto + `localStorage`.
- `raw-hash.ts` / `.test.ts` — content-hash helper for fingerprinting (idempotency keys, profile-snapshot dedup).

### Routing + errors

- `build-route-error-payload.ts` / `.test.ts` — builds the typed payload for `RouteErrorBoundary`.

### Sport canonicalisation

- `canonicalize-sport.ts` / `.test.ts` — normalises sport identifiers across formats.

### Analytics PII

- `scrub-analytics-string.ts` / `.test.ts` — masks free-text fields before they reach analytics. The trusted seam for R-PIIInterpolation when a string genuinely needs to be templated.

### React utils

- `merge-refs.ts` — combine multiple refs onto a single ref slot (used inside the editor's atoms).

### Generated / static

- `fitsdk-minimal/profile.js` — generated minimal FIT SDK profile (see `../scripts/generate-fitsdk-minimal.mjs`).

## Subdirectories

- `focus/` — overlay-observer + fallback-chain helpers used by `hooks/focus/`.
- `profile-snapshot/` — `profile-to-snapshot` mapper (used by `use-profile-snapshot-push`).
- `fitsdk-minimal/` — generated FIT SDK profile.

## For AI Agents

### Working In This Directory

1. **No React, no Dexie.** This directory is the "pure helpers" tier. Hooks live in `src/hooks/`.
2. **Top-level side effects are forbidden.** Module load must not read `window.*`; accessors read on demand inside their function bodies (see `runtime-config.ts`).
3. **PII rule.** When code in `src/{components,hooks,lib}/**` calls `console.*` or `toast()`, the first arg MUST be a literal or a top-level SCREAMING_SNAKE_CASE constant referencing a literal. The scrubber in `scrub-analytics-string.ts` is the seam for templated strings that must reach analytics.

### Testing Requirements

- One `.test.ts` per non-trivial file. Generated files (`fitsdk-minimal/profile.js`) are excluded.

### Common Patterns

- Factory exports (`createXxx`) rather than classes.
- Co-located tests for every non-trivial helper.

## Dependencies

### Internal

- `../types/*` (helpers operate on domain types).
- `@kaiord/core`, `@kaiord/ai`.

### External

- `ai`, `@ai-sdk/*` (provider factory only).
- `zod` (validation).

<!-- MANUAL: -->
