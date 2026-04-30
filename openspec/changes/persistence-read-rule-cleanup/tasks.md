## 1A. Phase 1A — Foundation: `transaction` port + 4 lower-risk profile sites (PR #N — no user-visible change)

### 1A.0 — `PersistencePort.transaction` extension (gate before any use case)

- [x] 1A.0.1 Extend `PersistencePort` in `src/ports/persistence-port.ts` with `transaction<T>(fn: () => Promise<T>): Promise<T>`. Document inline that callers SHALL wrap multi-write operations whose partial application would leave inconsistent state. Update the existing "PersistencePort interface" requirement in `openspec/specs/spa-persistence-port/spec.md` (via the MODIFIED block in this change's spec delta).
- [x] 1A.0.2 Implement `transaction` on `DexiePersistenceAdapter` (`src/adapters/dexie/dexie-persistence-adapter.ts` or wherever the factory lives) by delegating to `db.transaction("rw", db.tables, fn)`. Co-located unit test (use the production Dexie + fake-indexeddb): success commits both writes; throw rolls both back. Sanity sub-test: write A; throw mid-transaction before write B; assert `getAll()` returns `[]` (verifies fake-indexeddb honors Dexie's `transaction.abort()`). If this sanity sub-test fails, escalate — switch the rollback test to integration-only against the real Dexie runtime.
- [x] 1A.0.3 Implement `transaction` on `createInMemoryPersistence()` (`src/test-utils/in-memory-persistence.ts`) with snapshot/revert: before invoking `fn`, capture each repo's full state via existing accessors into local closures; on `fn` resolution commit; on `fn` rejection restore state via `put` / `delete` / `setActiveId` calls and re-throw. Co-located unit test against the in-memory adapter: success commits + state preserved; throw reverts to prior state.

### 1A.1 — Live read hooks

- [x] 1A.1.1 Create `src/hooks/use-profiles-live.ts` — `useProfilesLive()` returning `useLiveQuery(() => db.table("profiles").toArray(), [])`. Inline comment documents the production-singleton binding (D1.3) and that fake-indexeddb backs `db` in tests (D5.1).
- [x] 1A.1.2 Create `src/hooks/use-profile-by-id-live.ts` — `useProfileByIdLive(id)` returning `useLiveQuery(() => db.table("profiles").get(id), [id])`. Inline comment notes the table-wide subscription side-effect.
- [x] 1A.1.3 Create `src/hooks/use-active-profile-live.ts` — `useActiveProfileLive()` implemented as a SINGLE composed `useLiveQuery` per design D1 (joins `meta.activeProfileId` with `profiles.get(id)` inside the same callback; returns `{id, profile}`).
- [x] 1A.1.4 Co-located unit tests for each: (a) positive case — data appears after a write through the production Dexie singleton (fake-indexeddb-backed); (b) atomic same-tab transition test for `useActiveProfileLive` — write `meta.activeProfileId` from `"A"` to `"B"`, then mutate `profiles` unrelated; assert no consumer ever observes `{id: "B", profile: null}` or `{id: "B", profile: ProfileA}` as an intermediate render. Atomicity is delivered by `useLiveQuery`'s implicit per-callback Dexie read transaction (D1), NOT by the writer using `persistence.transaction`; the writer's transaction is irrelevant to this read-side guarantee.

### 1A.2 — Application use cases (writes) — 9 use cases under `application/profile/`

- [x] 1A.2.1 Create `src/application/profile/create-profile.ts` — `createProfile(persistence, name, options?)`. When the persistence has no profiles yet (first profile), wraps the profile `put` and the `setActiveId` in `await persistence.transaction(async () => { ... })`. For subsequent profiles, single-write only (no transaction needed). Throws on rejection; caller surfaces toast.
- [x] 1A.2.2 Create `src/application/profile/update-profile.ts` — `updateProfile(persistence, profileId, updates)`. Validates profile exists (`getById`); throws `ProfileNotFoundError` if not.
- [x] 1A.2.3 Create `src/application/profile/delete-profile.ts` — `deleteProfile(persistence, profileId)`. Wraps `profiles.delete` AND `meta.activeProfileId` clear-if-matching in `persistence.transaction`.
- [x] 1A.2.4 Create `src/application/profile/set-active-profile.ts` — `setActiveProfile(persistence, profileId | null)`. Single-write; no transaction needed.
      Tasks 1A.2.5.1–1A.2.5.5 each create a zone use case under `src/application/profile/zones/` and move the corresponding helper logic from `profile-store/helpers/` to `application/profile/helpers/`. Each use-case function ≤40 LOC; helper functions also follow the ≤40 LOC rule.

- [x] 1A.2.5.1 Create `src/application/profile/zones/update-sport-thresholds.ts`; relocate the corresponding helper.
- [x] 1A.2.5.2 Create `src/application/profile/zones/update-sport-zones.ts`; relocate the corresponding helper.
- [x] 1A.2.5.3 Create `src/application/profile/zones/set-zone-method.ts`; relocate the corresponding helper.
- [x] 1A.2.5.4 Create `src/application/profile/zones/add-custom-zone.ts`; relocate the corresponding helper.
- [x] 1A.2.5.5 Create `src/application/profile/zones/remove-custom-zone.ts`; relocate the corresponding helper.
- [x] 1A.2.6 Co-located unit tests for each of 1A.2.1–1A.2.5.5 (9 use cases — 4 CRUD + 5 zone variants) against `createInMemoryPersistence()`. Each test asserts: success path; transaction rollback on simulated mid-transaction failure (where applicable: `createProfile` first-profile case, `deleteProfile`); error type on profile-not-found (where applicable).

### 1A.3 — Migrate the 4 lower-risk read sites + their write callsites

- [x] 1A.3.1 Migrate `src/components/organisms/ProfileManager/components/ProfileEditView.tsx` — read profile via `useProfileByIdLive(profileId)`; render skeleton when `undefined`; replace `useProfileStore` write actions with `usePersistence()` + the new use cases, `await`-ing each and catching to `useToastContext().error(...)`.
- [x] 1A.3.2 Migrate `src/components/templates/MainLayout/LayoutHeader.tsx` — replace `getActiveProfile()` with `useActiveProfileLive().profile`. Read-only site; no writes to migrate.
- [x] 1A.3.3 Migrate `src/components/molecules/TargetPicker/TargetPicker.tsx` — replace store reads with `useActiveProfileLive` (drop the `find(p => p.id === activeProfileId)` derivation). Read-only site; no writes to migrate.
- [x] 1A.3.4 Migrate `src/components/organisms/AiWorkoutInput/ZoneIndicator.tsx` — `useActiveProfileLive()`. Read-only site; no writes to migrate.

### 1A.4 — Update tests for the 4 migrated sites

Pattern for these tests per D5.1: mount inside `<PersistenceProvider persistence={createDexiePersistenceAdapter(db)}>` (where `db` is the production Dexie singleton, fake-indexeddb-backed in jsdom). Pre-populate via `await persistence.profiles.put(...)` (or `await db.table("profiles").put(...)` for direct setup). `useLiveQuery` re-fires automatically because fake-indexeddb implements the Dexie observable contract.

- [x] 1A.4.1a Update `ProfileManager.test.tsx` — add a `beforeEach` that clears `db.table("profiles")` and `db.table("meta")`. Defensive: prevents fake-indexeddb residue from a prior test leaking into a new one now that `ProfileEditView` (subcomponent) reads via `useProfileByIdLive` against Dexie.
- [ ] 1A.4.1b Update `ProfileManager.test.tsx` — replace `useProfileStore.setState({...})` with the fake-indexeddb-backed `<PersistenceProvider>` setup. Add a test verifying the error indication surfaces when a use case rejects (inject a rejecting `persistence.profiles.put` for that test only). Deferred to Phase 1B (`1B.2`) — the parent `ProfileManager` component is still legacy in Phase 1A; the full swap + toast test land when `useProfileManager` migrates in `1B.1.1`.
- [x] 1A.4.2 Update `LayoutHeader.test.tsx` (profile cases) — same pattern.
- [x] 1A.4.3 Update `TargetPicker.test.tsx` — same pattern.
- [x] 1A.4.4 Update `ZoneIndicator.test.tsx` — same pattern.

### 1A.5 — Validation

- [x] 1A.5.1 Verify the 4 unmigrated sites (`useProfileManager`, `useAiGeneration`, `useSportZoneEditor`, `use-active-profile.ts`) still read correctly from the legacy `useProfileStore` — no behavioral regression.
- [x] 1A.5.2 Run `pnpm --filter @kaiord/workout-spa-editor test` — passing.
- [x] 1A.5.3 Run `pnpm --filter @kaiord/workout-spa-editor lint` — clean. Confirm `grep -rn "from.*adapters/dexie/dexie-database" packages/workout-spa-editor/src/application/` returns zero matches.
- [x] 1A.5.4 Run `pnpm -r build` — clean.
- [x] 1A.5.5 **Capture pre-migration perf baseline** for `1B.5.2`: while the legacy `useProfileStore` still backs the 4 unmigrated sites, record render counts for `LayoutHeader` (active-profile-change interaction) and `useAiGeneration` (provider-change interaction) using React Profiler. Commit the captured numbers as `packages/workout-spa-editor/src/__perf__/profile-state-baseline.json` with shape `{ "layoutHeader": <count>, "useAiGeneration": <count>, "capturedAt": "<ISO date>", "capturedAgainstSha": "<git sha>", "methodology": "<one sentence describing the interaction trace>" }`. Phase 1B's `1B.5.2` reads this file and asserts `post / pre <= 2` per metric, failing loudly if the file is absent. Mechanical dependency, not editorial.
- [x] 1A.5.6 Add a `none` changeset for `@kaiord/workout-spa-editor` (per D6: Phase 1A has no user-visible change). Title: `chore(spa-editor): foundation for profile state migration to Dexie + useLiveQuery`.
- [x] 1A.5.7 Open PR; ensure CI green; squash merge. — PR #389

## 1B. Phase 1B — High-risk profile migrations + delete legacy (PR #N+1 — closes #385)

### 1B.1 — Migrate the 4 high-risk read sites + their write callsites

- [x] 1B.1.1 Migrate `src/components/organisms/ProfileManager/useProfileManager.ts` — read `profiles` via `useProfilesLive()`, `activeProfileId` via `useActiveProfileLive().id`. Replace every Zustand action callsite with the application use cases injected via `usePersistence()`. `await` the use cases; surface failures via `useToastContext().error(...)`.
- [x] 1B.1.2 Migrate `src/components/organisms/AiWorkoutInput/useAiGeneration.ts` — replace `getActiveProfile` callback with the `useLatestRef` pattern: introduce (if absent) `src/hooks/use-latest-ref.ts` exporting `useLatestRef<T>(value: T): { readonly current: T }` (`useRef` + `useEffect` to keep `.current` in sync each render); confirm via `grep -rn "useLatestRef" packages/workout-spa-editor/src` whether it exists and either reuse or create. The hook lets the LLM call read the latest profile snapshot at call time without re-subscribing the LLM-call closure on every profile change (which would cancel in-flight generation). Co-located unit test for `useLatestRef`.
- [x] 1B.1.3 Migrate `src/components/organisms/ZoneEditor/hooks/useSportZoneEditor.ts` — read profile via `useProfileByIdLive(profileId)`; replace zone action calls with the 5 zone use cases injected via `usePersistence()`; `await` and surface errors via toast.

### 1B.2 — Update tests for the 3 high-risk component sites

- [x] 1B.2.1 Update `useProfileManager` tests (or `ProfileManager.test.tsx` profile-creation/deletion cases extended in 1A.4) — switch to the fake-indexeddb-backed pattern.
- [x] 1B.2.2 Update `SportZoneEditor.test.tsx` — switch to the fake-indexeddb-backed pattern; mock the 5 zone use cases via `vi.mock` for action-success / action-failure scenarios.
- [x] 1B.2.3 Update `src/components/organisms/AiWorkoutInput/useAiGeneration.analytics.test.ts` (file confirmed to exist at this path) to the fake-indexeddb-backed pattern + pre-populated active profile.
- [x] 1B.2.4 Migrate assertions from `store/profile-store.test.ts`, `store/profile-store/sport-zone-actions.test.ts`, and `store/profile-store/default-sport-zones.test.ts` to `application/profile/*.test.ts` against the new use cases. Delete the legacy test files after migration confirms equivalent coverage. (Behavior change documented: the new `deleteProfile` use case clears `meta.activeProfileId` when it matched the deleted id; the legacy "reassign to first remaining profile" semantic is intentionally dropped per the design `clear-if-matching` rule. The user re-selects an active profile after deletion.)

### 1B.3 — #385 regression tests

- [x] 1B.3.1 Add a test under the calendar-header-equivalent component (locate via `grep -rn "CalendarHeader" packages/workout-spa-editor/src/components`): render with no linked accounts in the fake-indexeddb-backed Dexie; call `linkAccount` via the same persistence; `waitFor` the Sync button to appear without re-rendering the component. (Locks in "toast and Sync button consistency" — Connect Train2Go scenario.) — Implemented in `src/__regressions__/issue-385.test.tsx` (1B.3.1 case).
- [x] 1B.3.2 Add a test: pre-populate Dexie with two profiles + a `meta.activeProfileId`, mount Profile Manager; assert both profiles appear and the active one is marked active. (Locks in "refresh shows persisted profiles".) — `issue-385.test.tsx` 1B.3.2 case.
- [x] 1B.3.3 Add a test: mount a same-tab consumer reading `useActiveProfileLive()`; trigger `setActiveProfile(persistence, "B")` synchronously from a sibling component (NOT cross-tab); assert the consumer never observes `{id: "B", profile: <profileA-data>}` or `{id: "B", profile: null}`. — `issue-385.test.tsx` 1B.3.3 case.

### 1B.4 — Delete legacy

- [x] 1B.4.1 Delete `src/store/profile-store.ts`.
- [x] 1B.4.2 Delete `src/store/profile-store/` directory recursively.
- [x] 1B.4.3 Delete `src/hooks/use-active-profile.ts`. Update all callers to import `useActiveProfileLive` from `src/hooks/use-active-profile-live.ts`.
- [x] 1B.4.4 Verify zero references to `useProfileStore` via `grep -rn "useProfileStore" packages/workout-spa-editor/src`; verify zero stale imports of the deleted shim via `grep -rnE "from ['\"](.*)hooks/use-active-profile['\"]" packages/workout-spa-editor/src` returns zero matches (only `use-active-profile-live` imports remain). `pnpm exec tsc --noEmit` clean.

### 1B.5 — Validation

- [ ] 1B.5.1 **Accessibility smoke**: keyboard-navigate Profile Manager (open dialog, tab through profiles list, edit, save, delete, switch active). Confirm aria-live announcements for loading states and toast surfaces.
- [x] 1B.5.2 **Performance smoke** (React Profiler): re-record render counts for `LayoutHeader` (active-profile-change interaction) and `useAiGeneration` (provider-change interaction) under the post-Phase-1B code. Read the pre-migration baseline from `packages/workout-spa-editor/src/__perf__/profile-state-baseline.json` (committed in `1A.5.5`); fail loudly if absent. Assert post-counts ≤ 2× pre-counts per metric. — Gate test in `src/__perf__/profile-state-baseline.measure.test.tsx`; passes with both metrics at baseline (2 renders each).
- [x] 1B.5.3 Run `pnpm --filter @kaiord/workout-spa-editor test` — passing.
- [x] 1B.5.4 Run `pnpm --filter @kaiord/workout-spa-editor lint` — clean.
- [x] 1B.5.5 Run `pnpm -r build` — clean.
- [ ] 1B.5.6 Update `packages/workout-spa-editor/README.md` (or the SPA's primary internal docs file, if any) to reference the new live hooks and use cases instead of the deleted Zustand store.
- [ ] 1B.5.7 Add a `patch` changeset for `@kaiord/workout-spa-editor` titled `fix(spa-editor): migrate profile state to Dexie + useLiveQuery — closes #385`. — HOLD: deferred until Phase 1A (#389) merges to main, then added on top of the rebased branch.
- [ ] 1B.5.8 Open PR; ensure CI green; squash merge. Verify in production: Connect Train2Go shows Sync button immediately; refresh preserves profiles. — HOLD: opens after Phase 1A (#389) merges.

## 2. Phase 2 — Library store full migration (PR #N+2)

### 2.1 — Live read hook

- [ ] 2.1.1 Rename `useLibraryTemplates` (in `src/components/pages/library-hooks.ts`) to `useLibraryTemplatesLive`; relocate to `src/hooks/use-library-templates-live.ts`. Update call sites.

### 2.2 — Application use cases (writes) — 3 use cases

- [ ] 2.2.1 Create `src/application/library/add-template.ts` — `addTemplate(persistence, name, sport, krd)`. Generates id; writes via `persistence.templates.put`; returns the new template.
- [ ] 2.2.2 Create `src/application/library/delete-template.ts` — `deleteTemplate(persistence, templateId)`.
- [ ] 2.2.3 Create `src/application/library/update-template.ts` — `updateTemplate(persistence, templateId, updates)`.
- [ ] 2.2.4 Co-located unit tests against `createInMemoryPersistence()`.

### 2.3 — Migrate 4 consumer files (read+write)

- [ ] 2.3.1 Migrate `src/components/templates/MainLayout/LayoutHeader.tsx` (badge counter) — read templates via `useLibraryTemplatesLive`. Note: this file was previously touched in 1A.4.2 (profile cases); now extend to library cases.
- [ ] 2.3.2 Migrate `src/components/organisms/WorkoutLibrary/hooks/useWorkoutLibrary.ts` — read via the live hook; replace `deleteTemplate` callsite with the use case.
- [ ] 2.3.3 Migrate `src/components/molecules/SaveToLibraryButton/useSaveToLibrary.ts` — replace `addTemplate` (Zustand action) with the use case; `await`; surface errors via toast.
- [ ] 2.3.4 Delete `src/hooks/use-library.ts`. Call sites read directly via `useLibraryTemplatesLive`.

### 2.4 — Update tests

- [ ] 2.4.1 Update `LayoutHeader.test.tsx` library-badge cases (overlapping touchpoint with 1A.4.2) — use the fake-indexeddb-backed pattern instead of `useLibraryStore.setState({...})`.
- [ ] 2.4.2 Migrate assertions from `store/library-store.test.ts` to `application/library/*.test.ts` against the new use cases. Delete the legacy test file after migration confirms equivalent coverage.
- [ ] 2.4.3 Update `save-as-template.test.ts` — switch to the fake-indexeddb-backed pattern.

### 2.5 — Regression test

- [ ] 2.5.1 Pre-populate Dexie with two templates; mount `LayoutHeader`; assert badge shows "2" without any user interaction. (Locks in "library badge after refresh".)

### 2.6 — Delete legacy

- [ ] 2.6.1 Delete `src/store/library-store.ts`, `src/store/library-store/` (actions, persistence, initial-state, types).
- [ ] 2.6.2 Verify zero references to `useLibraryStore` / `useLibrary` via grep.

### 2.7 — Validation

- [ ] 2.7.1 A11y smoke for WorkoutLibrary dialog: open, keyboard-navigate templates, delete, save-from-editor.
- [ ] 2.7.2 Run `pnpm --filter @kaiord/workout-spa-editor test` — passing.
- [ ] 2.7.3 Run `pnpm --filter @kaiord/workout-spa-editor lint` — clean.
- [ ] 2.7.4 Run `pnpm -r build` — clean.
- [ ] 2.7.5 Update internal docs to reference the new hook + use cases.
- [ ] 2.7.6 Add a `patch` changeset titled `fix(spa-editor): migrate library state to Dexie + useLiveQuery (latent bug from same root cause as #385)`.
- [ ] 2.7.7 Open PR; ensure CI green; squash merge. Verify in production: refresh after creating templates preserves the badge count.

## 3. Phase 3 — AI store split (PR #N+3)

### 3.0 — Singleton barrel for live-hook binding

- [ ] 3.0.1 First grep `grep -rn "aiProviderRepository" packages/workout-spa-editor/src/adapters/dexie` to determine whether the singleton is already exported. If exported, reuse the existing path; if not, create or update `src/adapters/dexie/index.ts` to export `aiProviderRepository = createDexieAiProviderRepository(db)` as a module-level singleton. Inline comment documents the D1.3 / D3.1 binding rule and the HMR caveat (D3 — under HMR the module may briefly produce two instances closing over the same `db`; production-safe).

### 3.1 — Live read hooks (no transaction wrapper)

- [ ] 3.1.1 Create `src/hooks/use-ai-providers-live.ts` — `useAiProvidersLive()` returning `useLiveQuery(() => aiProviderRepository.getAll(), [])` per design D3 / D3.3. The unwrapped form is intentional: a `db.transaction("r", ...)` wrapper would commit at the first WebCrypto await; consistency comes from `toArray()`'s JS-memory snapshot, not from a Dexie read transaction. Add an inline anti-pattern comment in the file: `// Do NOT wrap in db.transaction("r", ...) — the Dexie tx commits at the first WebCrypto await inside decryptProvider; consistency comes from toArray()'s JS-memory snapshot. See design.md D3.3.`
- [ ] 3.1.2 Create `src/hooks/use-ai-custom-prompt-live.ts` — `useAiCustomPromptLive()` returning `useLiveQuery(() => db.table("meta").get("ai_custom_prompt").then(r => r ? (r.value as string) : null), [])`. Returns `null` for missing-row case (per D1.4); consumers distinguish loading (`undefined`), missing (`null`), empty (`""`).
- [ ] 3.1.3 Co-located unit tests covering:
  - Provider read returns plaintext `apiKey` matching the input.
  - `db.table("aiProviders").get(id).apiKey` returns ciphertext (encryption-at-rest invariant).
  - `useAiProvidersLive` re-fires when a new provider is written via the use case (verifies live-query reactivity through the repository's decryption pass).
  - `useAiCustomPromptLive` returns `undefined` while loading, `null` when no row, the value when present, and `""` when the row holds an empty string.

### 3.2 — Runtime store + application use cases (6 use cases)

- [ ] 3.2.1 Create `src/store/ai-runtime-store.ts` — Zustand store holding only `selectedProviderId: string | null`, `generation: GenerationState`, with actions `selectForGeneration`, `setGeneration`. ZERO persistence imports.
- [ ] 3.2.2 Create `src/application/ai/add-provider.ts` — `addProvider(persistence, config)`. Implements invariant I1: if `getAll().length === 0`, set `isDefault: true` on the new provider. Wraps in `persistence.transaction` for atomicity with the read-then-write.
- [ ] 3.2.3 Create `src/application/ai/remove-provider.ts` — `removeProvider(persistence, id)`. Implements invariant I2: within `persistence.transaction`, deletes the target and (if the deleted was default and providers remain) sets `isDefault: true` on the next provider.
- [ ] 3.2.4 Create `src/application/ai/update-provider.ts`, `set-default-provider.ts`, `set-custom-prompt.ts`. Each takes `persistence` and writes via the appropriate repo or the `meta` table.
- [ ] 3.2.5 Create `src/application/ai/clear-all-providers.ts` — `clearAllProviders(persistence)`. Wraps batch delete in `persistence.transaction`. Replaces the legacy `useAiStore.setState({providers: []})` shortcut used by PrivacyTab.
- [ ] 3.2.6 Co-located unit tests for each of 3.2.2–3.2.5 covering: success path; rollback on simulated rejection — explicitly required for `addProvider` (read-then-write atomicity), `removeProvider` (delete-and-promote atomicity, I2), and `clearAllProviders` (if any individual delete in the batch rejects, the transaction rolls back and ALL providers remain present — no partial deletion); invariant I1 explicitly tested in `add-provider.test.ts`; invariant I2 explicitly tested in `remove-provider.test.ts`; invariant I3 (selected fallback) tested in `useAiRuntimeStore.test.ts`.

### 3.3 — Migrate the 7 consumer files

- [ ] 3.3.1 `src/main.tsx` — drop the `useAiStore` reference (was diagnostic exposure only).
- [ ] 3.3.2 `src/components/organisms/AiWorkoutInput/ModelSelector.tsx` — `providers` via `useAiProvidersLive`; `selectedProviderId` + `selectForGeneration` via `useAiRuntimeStore`.
- [ ] 3.3.3 `src/components/organisms/AiWorkoutInput/AiWorkoutInput.tsx` — `providers` via `useAiProvidersLive`; drop `hydrated` (use `providers === undefined` as loading signal).
- [ ] 3.3.4 `src/components/organisms/AiWorkoutInput/useAiGeneration.ts` — `getSelectedProvider` derived from `useAiProvidersLive` + `useAiRuntimeStore.selectedProviderId`; `customPrompt` via `useAiCustomPromptLive` (treat `null` as "no prompt configured"); `setGeneration` via `useAiRuntimeStore`. Add the I3-fallback `useEffect`: when `selectedProviderId` is no longer in the providers list, call `selectForGeneration(default?.id ?? null)`.
- [ ] 3.3.5 `src/components/organisms/AiWorkoutInput/AiWorkoutForm.tsx` — `generation` via `useAiRuntimeStore`.
- [ ] 3.3.6 `src/components/organisms/SettingsPanel/AiTab.tsx` — providers via `useAiProvidersLive`; CRUD actions via the use cases injected via `usePersistence()`. `await` use cases; surface errors via toast.
- [ ] 3.3.7 `src/components/organisms/SettingsPanel/PrivacyTab.tsx` — replace `useAiStore.setState({providers: []})` with `await clearAllProviders(persistence)`.

### 3.4 — Audits

- [ ] 3.4.1 **Analytics events audit**: run `grep -rn "analytics.event(\"ai\\." packages/workout-spa-editor/src --include="*.ts" --include="*.tsx"`. If matches exist, list each as a sub-task verifying the event still fires from the equivalent use case at the same logical point. If no matches, mark 3.4.1 as N/A and proceed.
- [ ] 3.4.2 **PII / secret audit (review-side)**: enumerate every new toast string introduced by Phase 3 **consumer components** (`AiTab.tsx`, `PrivacyTab.tsx`, and any other Phase 3 consumer with a try/catch/.catch invoking `useToastContext().error(...)`). Assert each string is statically constructed (no error-message interpolation that could leak `apiKey` fragments). Use cases themselves do NOT call the toast (toast is bound to React component scope); they propagate rejections via promise rejection, and the consumer component localises the user-facing string. Mechanical enforcement is provided by 3.4.3 axis 2 over the same component files; 3.4.2 is the human-review pass.
- [ ] 3.4.3 **PII / secret audit (test-side)**: two-axis assertion. Axis 1 (allowlist match): the toast strings rendered by the Phase 3 consumer components on simulated use-case rejection are members of a fixed allowlist of constants. Axis 2 (literal-source assertion): a small AST/regex walk over the **consumer component files** that catch use-case rejections — `AiTab.tsx`, `PrivacyTab.tsx`, and any other Phase 3-introduced consumer in 3.3.1–3.3.7 with a `try/catch` or `.catch()` invoking `useToastContext().error(...)` — confirms each toast invocation is called with a string-literal argument. No template-literal interpolation that embeds `error.message`, `provider.apiKey`, error spreads, or any other dynamic field. The use-case files themselves do NOT call the toast (toast is bound to React component scope); the audit therefore targets components, not use cases. Both axes pass = no apiKey-shaped fragment can leak regardless of provider type, today or under future error-message changes.

### 3.5 — Update tests

- [ ] 3.5.1.1 Update component test for `main.tsx` consumer — switch to the fake-indexeddb-backed pattern (or delete if no test asserts the dropped diagnostic export).
- [ ] 3.5.1.2 Update component test for `ModelSelector.tsx` — fake-indexeddb-backed pattern.
- [ ] 3.5.1.3 Update component test for `AiWorkoutInput.tsx` — fake-indexeddb-backed pattern.
- [ ] 3.5.1.4 Update component test for `useAiGeneration.ts` — fake-indexeddb-backed pattern + I3-fallback effect test.
- [ ] 3.5.1.5 Update component test for `AiWorkoutForm.tsx` — fake-indexeddb-backed pattern.
- [ ] 3.5.1.6 Update component test for `AiTab.tsx` — fake-indexeddb-backed pattern; assert error-toast surfaces on rejected use case (fixture: inject a rejecting `addProvider`).
- [ ] 3.5.1.7 Update component test for `PrivacyTab.tsx` — fake-indexeddb-backed pattern; assert `clearAllProviders` rejection surfaces error toast and persists no partial-deletion state.
- [ ] 3.5.2 New tests for `useAiRuntimeStore` (selectForGeneration / setGeneration; legacy assertions about runtime state; invariant I3 test).
- [ ] 3.5.3 Existing test in `dexie-ai-provider-repository.test.ts` (encryption-at-rest) MUST continue passing unchanged.

### 3.6 — Delete legacy

- [ ] 3.6.1 Delete `src/store/ai-store.ts`, `ai-store-actions.ts`, `ai-store-persistence.ts`, `ai-store-types.ts`.
- [ ] 3.6.2 Delete `src/hooks/use-ai-hydration.ts`. Remove its call from `src/hooks/use-store-hydration.ts`.
- [ ] 3.6.3 Verify zero references to `useAiStore` via grep.

### 3.7 — Validation

- [ ] 3.7.1 A11y smoke for AI settings tab: keyboard-navigate provider list, add, edit, delete, set default, set custom prompt.
- [ ] 3.7.2 Performance smoke: render count for `AiWorkoutInput` while typing in the prompt field. Live hooks MUST NOT cause a re-render storm on unrelated state changes.
- [ ] 3.7.3 Run `pnpm --filter @kaiord/workout-spa-editor test` — passing.
- [ ] 3.7.4 Run `pnpm --filter @kaiord/workout-spa-editor lint` — clean.
- [ ] 3.7.5 Run `pnpm -r build` — clean.
- [ ] 3.7.6 Update internal docs.
- [ ] 3.7.7 Add a `patch` changeset titled `refactor(spa-editor): split AI store into persisted slice (Dexie/useLiveQuery) and runtime slice (Zustand)`.
- [ ] 3.7.8 Open PR; ensure CI green; squash merge. Verify in production: AI providers reload after refresh; generation status still updates live; no encryption regression.

## 4. Phase 4 — Mechanical guard + final consolidation (PR #N+4)

### 4.1 — Guard script

- [ ] 4.1.1 Create `scripts/check-no-zustand-writethrough.mjs` per design D4. Implementation: walk `packages/workout-spa-editor/src/store/**/*.{ts,tsx}` AND `packages/workout-spa-editor/src/application/**/*.{ts,tsx}` (excluding `*.test.{ts,tsx}`), parse each file's import statements (using the TypeScript compiler API or a small AST parser), and:
  - Fail (rule R-DexieImport) if any non-allowlisted file under `src/store/**` imports a path resolving to `adapters/dexie/dexie-database`. The script normalises through (a) relative paths, (b) tsconfig path aliases (parse from the workspace `tsconfig.json`), (c) barrel re-exports, (d) `await import(...)` dynamic imports.
  - Fail (rule R-PersistStateImport) if any non-allowlisted file under `src/store/**` imports an identifier named `persistState` from any path.
  - Fail (rule R-AppDexieImport) if ANY file under `src/application/**` imports a path resolving to `adapters/dexie/dexie-database` (no allowlist — application code MUST go through `PersistencePort`).
  - Output the offending file + import + rule on failure.
- [ ] 4.1.2 Hard-coded allowlist in 4.1.1: file paths confirmed by reading the current `useWorkoutStore` implementation (after Phases 1–3 land). Each entry has a one-line comment explaining why.

### 4.2 — Co-located test

- [ ] 4.2.1 Create `scripts/check-no-zustand-writethrough.test.mjs` (`node:test`) covering fixture files under `scripts/__fixtures__/check-no-zustand-writethrough/`:
  - Positive case: post-Phase-3 codebase passes.
  - R-DexieImport relative path negative.
  - R-DexieImport alias path (`@/...`) negative.
  - R-DexieImport barrel re-export negative.
  - R-DexieImport dynamic `await import(...)` negative.
  - R-PersistStateImport negative.
  - Allowlist exemption (R-DexieImport): an allowlisted file with a `dexie-database` import passes.
  - Allowlist exemption (R-PersistStateImport): an allowlisted file with a `persistState` import passes.
  - R-AppDexieImport negative: a synthetic `application/foo/bar.ts` importing `dexie-database` is detected and named (no allowlist applies).

### 4.3 — Wire into CI

- [ ] 4.3.1 Confirm `pnpm test:scripts` includes the new script. If not, update the script glob and `package.json`.
- [ ] 4.3.2 Run `pnpm test:scripts` locally — all green including the new file.

### 4.4 — Final dead-code sweep

- [ ] 4.4.1 Search the repo for any leftover references to deleted modules (`useProfileStore`, `useLibraryStore`, `useAiStore`, `use-active-profile`, `use-library`, `use-ai-hydration`). All should be zero. Delete any orphaned imports.
- [ ] 4.4.2 Confirm `useStoreHydration` no longer references AI hydration.

### 4.5 — Validation

- [ ] 4.5.1 Run `pnpm --filter @kaiord/workout-spa-editor test` — passing.
- [ ] 4.5.2 Run `pnpm --filter @kaiord/workout-spa-editor lint` — clean.
- [ ] 4.5.3 Run `pnpm -r build` — clean.
- [ ] 4.5.4 Run `pnpm test:scripts` — passing including the new guard.
- [ ] 4.5.5 Update internal docs to reference the new persistence rule and the guard script.
- [ ] 4.5.6 Add a `patch` changeset titled `chore(spa-editor): lock in no-Zustand-write-through guard for persisted entities`.
- [ ] 4.5.7 Open PR; ensure CI green; squash merge.

## 5. Wrap-up

### 5.1 — Spec-scenario coverage map

For each scenario in `specs/spa-persistence-port/spec.md`, identify the task that delivers a passing test:

| Scenario                                                                                   | Task that adds the test                                                                                                                  |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Connect Train2Go updates the calendar header in real time                                  | 1B.3.1                                                                                                                                   |
| Profiles, templates, and AI providers survive a page refresh                               | 1B.3.2 (profiles), 2.5.1 (templates), 3.5.1.6 (AI providers — `AiTab.tsx` provider list renders from `useAiProvidersLive` after refresh) |
| Active profile join is observed atomically within a single tab                             | 1A.1.4 (positive) + 1B.3.3 (sibling-driven)                                                                                              |
| Mechanical guard catches a `dexie-database` import in a non-allowlisted store              | 4.2.1 (R-DexieImport relative + alias + barrel + dynamic)                                                                                |
| Mechanical guard catches a `persistState` import in a non-allowlisted store                | 4.2.1 (R-PersistStateImport)                                                                                                             |
| Allowlisted explicit-user-action write succeeds                                            | 4.2.1 (allowlist exemption case)                                                                                                         |
| Use case rejection surfaces as a user-visible error                                        | 1A.4.1 (profile use cases via component test); 2.7 (library); 3.5.1 (AI)                                                                 |
| Reactive propagation across stores after a write through `PersistencePort`                 | 1B.3.1 (linkAccount→Sync button); plus structurally exercised by every component test using fake-indexeddb-backed Dexie + the live hooks |
| Multi-write use case rolls back on partial failure                                         | 1A.0.3 (in-memory adapter); 1A.2.6 (use-case-level: `createProfile` and `deleteProfile` rollback tests)                                  |
| Application use case does not import Dexie directly                                        | 4.2.1 (R-AppDexieImport fixture — mechanical guard); 1A.5.3 (transitional grep sanity check before Phase 4 lands)                        |
| PersistencePort.transaction MODIFIED scenario (multi-write use case uses port transaction) | 1A.2.6 (test fixtures explicitly use `persistence.transaction`); 1A.0.2 + 1A.0.3 (adapter behavior)                                      |
| User edits a workout in the editor (preserved)                                             | existing `useWorkoutStore` tests; no change                                                                                              |
| User saves workout to library (preserved)                                                  | existing test; no change                                                                                                                 |

- [ ] 5.1.1 Confirm the table above is in sync with the final spec scenarios at archive time.

### 5.2 — Verify

- [ ] 5.2.1 Run `/opsx-verify` against this change — every spec scenario across the three ADDED requirements and the two MODIFIED requirements covered by tests in the table above.

### 5.3 — Sync

- [ ] 5.3.1 Run `/opsx-sync` — confirm `spa-persistence-port` spec is in sync with code after Phase 4. No drift expected because every requirement was implemented in lockstep.

### 5.4 — Archive

- [ ] 5.4.1 After all five PRs merged: `/opsx-archive` — moves change to `openspec/changes/archive/YYYY-MM-DD-persistence-read-rule-cleanup/`.
- [ ] 5.4.2 Open follow-up issue: "PII / secret-leakage mechanical guard for SPA editor toasts and console" — captures the deferred Open Question from `design.md` "Open Questions / Follow-ups". Replace the placeholder TODO in `design.md` with the issue link before archiving.
