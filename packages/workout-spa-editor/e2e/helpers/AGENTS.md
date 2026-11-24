<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `e2e/helpers/`

## Purpose

Flow-specific Playwright helpers. Distinguished from `e2e/test-utils/` (generic utilities) — these helpers know about the SPA's state shape.

## Key Files

- `e2e-defaults.ts` — common timeouts + selectors.
- `kaiord-idb.ts` — raw IndexedDB reads/writes of `kaiord-spa` for production-bundle specs (no dev hooks). Never creates the database (aborts on `oldVersion 0`), closes on `versionchange` and on every path; `pollKaiordStore` returns `undefined` while the database is absent, the others throw. Use it instead of a hand-written `indexedDB.open("kaiord-spa")`.
- `turn-on-capability.ts` — `turnOnCapability` turns a Capability on through Settings, Capabilities, as the athlete does. Specs against the production build use it because that build exposes no database handle to seed decisions with.
- `kaiord-idb-version.ts` — `kaiordNativeVersion` reads the installed native version of `kaiord-spa` the same safe way; `nextMajorNative` turns it into the next major. A spec that simulates a newer deploy derives its version from these, never a hard-coded number that the next schema bump makes stale.
- `seed-dexie.ts` — talks to `window.__KAIORD_DB__` (the dev-mode hook from `adapters/dexie/dexie-database.ts`) to seed and clear IndexedDB.
- `dexie-factories.ts` — factory functions producing canonical Dexie rows (workout, profile, coaching activity, session match).
- `seed-stores.ts` — seeds Zustand stores by dispatching test-only setters.
- `seed-profile.ts` — single-call profile seed (creates row + sets active id).
- `load-test-workout.ts`, `load-test-workout-with-blocks.ts` — load a known-good workout into the editor.
- `build-repetition-steps.ts` — programmatic factory for repetition-block content.
- `seed-empty-workout.ts` — navigates to `/workout/new?action=import` so the hidden `<input type="file">` is mounted in the DOM; optional `krd` arg short-circuits via the `__KAIORD_WORKOUT_STORE__` dev global to pre-seed the editor with a built workout.
- `focus-management-helpers.ts` — assertions for the focus-after-action suite.
- `mobile-menu.ts` — open / close the mobile menu surface.
- `train2go-bridge-stub.ts` + `train2go-bridge-stub-page-script.ts` — installs an in-page Train2Go bridge so coaching flows can run without the real extension.

## For AI Agents

### Working In This Directory

1. **Helpers talk to the dev-mode window hooks.** The `__KAIORD_DB__` and store-seeding hooks are exposed only in `import.meta.env.DEV` — production builds don't carry them.
2. **One concern per helper.** When a helper grows past the size cap, split it.
3. **Bridge stub injection:** the page-script file is loaded with `page.addInitScript` so it runs before the SPA boots.

## Dependencies

### Internal

- The SPA's dev-mode window hooks.

### External

- `@playwright/test`.

<!-- MANUAL: -->
