<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `e2e/fixtures/`

## Purpose

Playwright fixtures and static test data shared across specs.

## Key Files

- `base.ts` — Playwright `test.extend(...)` base fixture composed by every spec; wires page setup, Dexie seed, and bridge stubs.
- `api-mocks.ts` — `page.route(...)`-based HTTP mocks (e.g. Garmin Connect Lambda endpoint).
- `llm-responses.ts` — canned LLM response payloads keyed by prompt fingerprint; used by `ai-generate-workout.spec.ts` so AI flows don't hit a real provider.
- `static-pages-server.ts` — tiny static-page server for tests that need a non-SPA origin.
- `focus-workout.krd.json` — KRD fixture used by `focus-management.spec.ts`.

## For AI Agents

### Working In This Directory

1. **Stable fixtures.** Changing fixture data may invalidate assertions across the suite. Add new fixtures rather than mutating existing ones.
2. **`base.ts` is the canonical entry.** Specs use `import { test, expect } from "./fixtures/base"` — never `@playwright/test` directly.

## Dependencies

### Internal

- `../helpers/*` (composed into the base fixture).

### External

- `@playwright/test`.

<!-- MANUAL: -->
