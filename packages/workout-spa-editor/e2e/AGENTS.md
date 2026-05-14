<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `e2e/`

## Purpose

Playwright end-to-end tests. Runs against a `pnpm dev` Vite server on `http://localhost:5173`. Tests cover every critical user flow: load/edit/save, calendar navigation, library, AI generation, coaching dialog, drag-and-drop, modals, mobile touch, accessibility, focus management, profiles, zones sync, and route refresh.

## Key Files

### Configuration

- `../playwright.config.ts` — base URL, 5 projects (Chromium / Firefox / WebKit / Mobile Chrome / Mobile Safari), webServer wiring (`pnpm dev`), 60s test timeout, 10s action/expect timeout, retries=2 in CI.
- `test-setup.ts` — Playwright-level setup hook.
- `README.md` — historical inventory of specs and run commands.

### Spec files (one per flow)

- `workout-load-edit-save.spec.ts`, `workout-creation.spec.ts`, `workout-lifecycle.spec.ts` — basic editor flows.
- `accessibility.spec.ts`, `focus-management.spec.ts` — a11y + focus invariants.
- `mobile-responsive.spec.ts`, `mobile-touch-drag.spec.ts`, `MOBILE-TOUCH-DRAG-SUMMARY.md` — mobile-specific.
- `drag-drop-reordering.spec.ts`, `copy-paste.spec.ts`, `delete-undo.spec.ts`, `step-selection.spec.ts` — editor list operations.
- `calendar-{navigation,workouts,empty-states,batch,performance}.spec.ts` — calendar flows.
- `library-{flows,calendar}.spec.ts`, `workout-library.spec.ts` — library flows.
- `coaching-dialog-{redesign,train2go}.spec.ts` — coaching dialog flows.
- `advanced-workouts.spec.ts`, `repetition-blocks.spec.ts` — block + advanced-step flows.
- `import-export-formats.spec.ts` — round-trip across FIT / TCX / ZWO / KRD / GCN.
- `ai-generate-workout.spec.ts` — AI generation (stubbed LLM responses via `fixtures/llm-responses.ts`).
- `profiles.spec.ts`, `zones-sync.spec.ts` — profile + Train2Go zone sync flows.
- `settings.spec.ts`, `onboarding.spec.ts` — settings + onboarding.
- `button-improvements.spec.ts`, `modal-interactions.spec.ts`, `error-handling.spec.ts` — UX guardrails.
- `spa-route-refresh.spec.ts` — F5/hard-reload preservation.

## Subdirectories

- `fixtures/` — Playwright fixtures + stubbed LLM responses + static-pages server + sample KRD.
- `helpers/` — flow-specific helpers (seed Dexie, seed stores, build repetition steps, expand file upload, focus-management helpers, mobile menu, Train2Go bridge stub).
- `test-utils/` — generic Playwright utilities (touch drag, viewport configs, performance helpers, verification helpers).

## For AI Agents

### Working In This Directory

1. **`pnpm dev` is the server.** Playwright's `webServer` config starts it; tests run against `http://localhost:5173`.
2. **Dexie state is seeded via `helpers/seed-dexie.ts`** which talks to the dev-mode `window.__KAIORD_DB__` hook exposed by `adapters/dexie/dexie-database.ts`.
3. **Zustand state is seeded via `helpers/seed-stores.ts`.**
4. **Bridge tests stub the extension** via `helpers/train2go-bridge-stub.ts` (Page-script injection from `train2go-bridge-stub-page-script.ts`).
5. **AAA + `should ` titles** apply here too (vitest title rule). Playwright reads the titles for reporting.
6. **Mobile projects (`Mobile Chrome`, `Mobile Safari`) have touch enabled** and exercise the touch-drag suite.
7. **Flakiness measurement:** `pnpm test:e2e:flakiness*` runs the suite N times to surface flaky specs.

### Testing Requirements

- New flows MUST include at least one spec in this directory.
- Stable selectors (`data-testid`) are the convention; classes are not stable enough for E2E.
- Tests MUST clean Dexie state between cases (`helpers/seed-dexie.ts` exposes a `clear` path).

### Common Patterns

- Spec naming: `<flow>.spec.ts`.
- Helpers are imported by name (no barrel exports).
- Per-project skips use `test.skip(({ browserName }) => ...)` rather than separate spec files.

## Dependencies

### Internal

- `helpers/*`, `fixtures/*`, `test-utils/*`.
- The SPA itself via the dev server.

### External

- `@playwright/test`, `@axe-core/playwright` (where used for a11y assertions).

<!-- MANUAL: -->

Playwright is the primary regression surface for cross-cutting flows. When fixing a bug, ask whether a Playwright spec would have caught it — if yes, add one to the matching `*.spec.ts`.
