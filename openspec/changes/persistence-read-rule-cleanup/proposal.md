## Why

Issue #385 — the Train2Go connect toast falsely says "Linked Train2Go to Pablo" while the dialog stays "Not connected" and a refresh wipes profiles from the UI — is the visible symptom of an architectural drift in `@kaiord/workout-spa-editor`. Three Zustand stores (`useProfileStore`, `useLibraryStore`, `useAiStore`) hold persisted entities (profiles, templates, AI providers, custom prompt) and act as the read-source for the UI. Two of them (`useProfileStore`, `useLibraryStore`) initialize empty on every boot with no Dexie hydration, so refresh = empty UI. A new application use case introduced by `train2go-profile-link` (`linkAccount`) writes only to Dexie via `PersistencePort` — bypassing the Zustand mirror — so the dialog stays stale even within a session. `useLibraryStore` has the same shape and is a latent bug (templates badge shows 0 after refresh until something writes). `useAiStore` has `useAiHydration` so its visible behavior is currently fine, but mixes persisted state (providers, customPrompt) with runtime state (selectedProviderId, generation) and is vulnerable to the same class of bug if a future use case writes only to Dexie.

CLAUDE.md states the rule:

> **Zustand**: ONLY for `workout-store` (editor runtime: undo/redo, selection, clipboard). Never auto-persisted.
> **Dexie.js + `useLiveQuery`**: All persisted data (workouts, templates, profiles, AI providers, sync state). One query per page.
> Rule: "Editor runtime → Zustand. Persisted data → Dexie. Local UI → React state."

The spec at `openspec/specs/spa-persistence-port/spec.md` documents the workout-store boundary today but is silent on the read pattern for persisted entities; no requirement enforces the rule. This change adds the rule to the spec and brings all three drifted stores into compliance.

## What Changes

Single proposal, single capability (`spa-persistence-port`). Shipped as **5 sequenced PRs**, structured so each PR ships a coherent working state with no read/write schism. Phase 1 is split into 1A (foundation: port extension + pattern proof + low-risk migrations) and 1B (high-risk migrations + closes #385); the remaining phases each migrate one store fully.

- **Phase 1A — Foundation: `transaction` port + 4 lower-risk profile sites**: extend `PersistencePort` with a `transaction<T>(fn: () => Promise<T>): Promise<T>` method (Dexie adapter wraps `db.transaction("rw", db.tables, fn)`; in-memory adapter implements snapshot/revert semantics on rejection); add live hooks (`useProfilesLive`, `useProfileByIdLive`, `useActiveProfileLive`); add 9 application use cases under `application/profile/` (4 CRUD + 5 zone variants), all using the new `persistence.transaction(...)` for multi-write atomicity; migrate the 4 lower-risk read sites (`ProfileEditView`, `LayoutHeader`, `TargetPicker`, `ZoneIndicator`) to live hooks. Legacy `useProfileStore` stays in place to back the still-unmigrated 4 sites; nothing user-visible changes yet, but the production bug is unaffected — Phase 1A ships as a no-op for users.
- **Phase 1B — High-risk profile migrations + delete legacy (closes #385)**: migrate the remaining 4 read sites (`useProfileManager`, `useAiGeneration`, `useSportZoneEditor`, plus the `use-active-profile` hook itself); migrate every component-level write call from `useProfileStore` actions to the application use cases; add #385 regression tests (toast/Sync-button consistency; refresh preservation; atomic active-profile join); delete `src/store/profile-store.ts` + `src/store/profile-store/` + `src/hooks/use-active-profile.ts`. Phase 1B carries the user-visible fix.
- **Phase 2 — Library store full migration**: rename `useLibraryTemplates` → `useLibraryTemplatesLive` (relocate to `src/hooks/`); replace 4 `useLibrary*` consumer files; promote `addTemplate` / `deleteTemplate` / `updateTemplate` to application use cases under `application/library/`; delete `src/store/library-store.ts` + `src/store/library-store/` + `src/hooks/use-library.ts`.
- **Phase 3 — AI store split**: split `useAiStore` (7 consumer files) into a persisted slice (Dexie via `useAiProvidersLive`, `useAiCustomPromptLive`) and a runtime slice (`useAiRuntimeStore` Zustand: `selectedProviderId`, `generation`); promote 6 application use cases (`addProvider`, `removeProvider`, `updateProvider`, `setDefaultProvider`, `setCustomPrompt`, `clearAllProviders`) preserving API-key encryption-at-rest at the repository boundary; preserve three multi-step invariants encoded in the legacy actions (I1: first provider becomes default; I2: removing default promotes next; I3: removing selected falls back to default for runtime selection — see design D3); delete `src/store/ai-store.ts` + helpers + `src/hooks/use-ai-hydration.ts`. Runtime slice (selection + generation status) remains legitimately Zustand-only.
- **Phase 4 — Mechanical guard + final consolidation**: ship `scripts/check-no-zustand-writethrough.mjs` (import-based check) + co-located `node:test` (per repo convention) that statically asserts no file under `packages/workout-spa-editor/src/store/**` imports from `adapters/dexie/dexie-database` OR imports a `persistState` helper, with a hard-coded allowlist for `useWorkoutStore`'s explicit-action write paths; wire the script into `pnpm test:scripts`. After Phase 4 the only Zustand store touching Dexie is `useWorkoutStore` (Save to Library, Push to Garmin); `useTrain2GoStore` and `useAiRuntimeStore` are runtime-only.

Each PR ships independently green: full per-entity test pass, lint clean, build clean. Phase 1B closes #385 in production; Phases 2–4 progressively eliminate latent bugs and architectural debt.

## Capabilities

### New Capabilities

None — this change extends an existing capability rather than introducing a new one.

### Modified Capabilities

- `spa-persistence-port`: ADDS three requirements (persisted-entity reactive read pattern; no Zustand-to-Dexie write-through; persistence transactions for multi-write use cases). MODIFIES two existing requirements: (a) "PersistencePort interface" — appends the `transaction<T>` paragraph and a new "Multi-write use case uses port transaction" scenario; (b) "Workout-store persistence boundary" — appends a "See also" cross-reference to the new no-write-through requirement (existing body and scenarios preserved verbatim).

## Impact

- **Affected packages:** `@kaiord/workout-spa-editor` only. No other `@kaiord/*` package touched.
- **Affected hexagonal layers:**
  - **Ports**: extended — `PersistencePort` adds a `transaction` method (Phase 1A). No removals or breaking signature changes; existing ports stay backwards-compatible.
  - **Application**: 18 new use cases — `application/profile/` (9 use case modules: 4 CRUD — create/update/delete/setActive — plus 5 zone variants: updateSportThresholds/updateSportZones/setZoneMethod/addCustomZone/removeCustomZone; helper logic moves alongside from `profile-store/helpers/` to `application/profile/helpers/`). `application/library/` (3: addTemplate/deleteTemplate/updateTemplate). `application/ai/` (6: addProvider/removeProvider/updateProvider/setDefaultProvider/setCustomPrompt/clearAllProviders). Each takes `PersistencePort` as a dependency (and uses `persistence.transaction(...)` for multi-write atomicity). No domain leak.
  - **Adapters / UI**: ~21 component and hook files migrate read paths from Zustand to `useLiveQuery`-backed hooks; the same files migrate write call sites to the new application use cases. `DexiePersistenceAdapter` adds a `transaction` implementation (`db.transaction("rw", db.tables, fn)`); `createInMemoryPersistence()` adds a snapshot/revert `transaction` implementation. Tests under those folders update setup helpers from `<store>.setState(...)` to either (a) `<PersistenceProvider persistence={createDexiePersistenceAdapter(db)}>` against the production Dexie singleton (fake-indexeddb-backed in jsdom — already loaded by `src/test-setup.ts`) for component / hook tests where `useLiveQuery` reactivity is required, or (b) `createInMemoryPersistence()` for use-case unit tests where reactivity is irrelevant. No module mock of `dexie-react-hooks` is required — fake-indexeddb implements the Dexie observable contract directly (D5).
  - **Domain**: No changes — the CLAUDE.md hexagonal rule (domain depends on nothing; application depends only on ports) is preserved.
- **Public APIs (`@kaiord/core` exports etc.)**: No changes. All affected hooks and stores are SPA-internal.
- **Domain specs referenced**: `openspec/specs/spa-persistence-port/spec.md` (modified — see "Capabilities"); `openspec/specs/spa-coaching-integration/spec.md` (already correct in spec; Phase 1B fixes the implementation gap that broke its "linkedAccounts gates Sync button" scenario in production).
- **Dependencies**: None added or removed. `dexie-react-hooks` (`useLiveQuery`) is already a dependency.
- **Migrations**: None. Dexie schema is unchanged; the data already lives in IndexedDB. This change only rewires the read and write paths.
- **Risk:**
  - Phase 1A: medium — new port surface (`transaction`) + spike + 4 read-site migrations + 9 use cases. Low user-visible regression risk because legacy paths remain.
  - Phase 1B: medium-high — 4 high-risk read-site migrations + write migrations + 3 deletions; ships the user-visible fix. Smaller PR than the prior single-Phase-1 plan.
  - Phase 2: low-medium — narrow surface (4 read-site files) and mechanical pattern reuse from Phase 1.
  - Phase 3: high — store split with 7 consumer files; encryption-at-rest invariant for API keys must be preserved via the Dexie read-transaction pattern (D3); three multi-step provider invariants must survive the split.
  - Phase 4: low — tooling and one consolidated guard test.
- **User-visible effects:**
  - Phase 1A is a no-op for users (live-hook reads run in parallel with the legacy Zustand reads on the 4 lower-risk sites; both produce equivalent UI).
  - Phase 1B ships the fix for #385 (Train2Go Sync button appears immediately after Connect; profiles survive refresh; toast and dialog are consistent).
  - Phase 2 fixes the latent "library badge shows 0 after refresh" regression.
  - Phases 3–4 have no end-user-visible behavior change; they remove architectural debt and prevent future regressions of the same class.
- **Breaking changes**: None. SPA-internal refactor only.
- **Sequencing rationale**: Phase 1A lands first to add the `transaction` port and prove the migration pattern on low-risk sites without exposing user-visible regression. Phase 1B then carries the production bug fix once the pattern is validated. Phase 2 reuses the pattern on the simplest store. Phase 3 extends the pattern with a store split. Phase 4 mechanically locks in the rule once Phases 1–3 have removed every existing write-through (otherwise the guard would block the earlier phases).
