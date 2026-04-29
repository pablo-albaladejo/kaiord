## Context

Three Zustand stores in `@kaiord/workout-spa-editor` hold persisted entities and serve as the read-source for the UI:

| Store                           | Persisted slice                             | Runtime slice                            | Boot hydration                              | Write-through to Dexie                                     |
| ------------------------------- | ------------------------------------------- | ---------------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `useProfileStore` (8 consumers) | profiles, activeProfileId, sportZones       | (none)                                   | **none** — `loadInitialState` returns empty | yes (legacy actions); no for `linkAccount`/`unlinkAccount` |
| `useLibraryStore` (4 consumers) | templates                                   | (none)                                   | **none**                                    | yes (legacy actions)                                       |
| `useAiStore` (7 consumers)      | providers (encrypted-at-rest), customPrompt | selectedProviderId, generation, hydrated | yes (`useAiHydration`)                      | yes                                                        |

Adapter layer that already does the right thing:

- `useWorkoutStore` — Zustand with no auto-persistence; writes only on explicit user actions. The pattern to lock in.
- `useTrain2GoStore` — runtime-only after `train2go-profile-link` (PR #372). No persistence touched.
- `LibraryPage`, calendar pages, settings UsageTab — already read via `useLiveQuery`. Hooks like `useLibraryTemplates` exist in `components/pages/library-hooks.ts`.
- `train2go-profile-link` (PR #372) introduced `linkAccount` / `unlinkAccount` as application use cases that go through `PersistencePort`. Architecturally correct, but exposed the drift: Zustand mirror is no longer the only writer, so any UI that reads from Zustand sees stale state.

Test infrastructure already in place (`packages/workout-spa-editor/src/test-setup.ts`):

- `import "fake-indexeddb/auto";` — fake-indexeddb is loaded globally for every test, so the production Dexie singleton `db` is backed by a real (in-memory) IndexedDB implementation in tests, with full Dexie observable contract support (`useLiveQuery` re-fires on writes, BroadcastChannel works the same way).

Constraint: change is SPA-internal. No public API changes; no Dexie schema migration; data already in IndexedDB. The user lives with the bug today (#385 in production). Hexagonal layering must hold: application code MUST NOT import `db` directly; all persistence operations go through `PersistencePort`.

## Goals / Non-Goals

**Goals:**

- Make `useLiveQuery` against Dexie the single read path for persisted entities (profiles, templates, AI providers, custom prompt).
- Move all persistence writes through application-layer use cases that take a `PersistencePort` (or specific repository) — no Zustand action shall write directly to Dexie.
- Provide multi-write atomicity through a port-level `transaction` method so application use cases never import `db` directly.
- Each phase migrates ONE store fully (read + write + delete legacy) so no PR ships a half-migrated read/write schism. Phase 1 is split into 1A (foundation, no user-visible change) and 1B (high-risk + #385 fix) to keep PRs reviewable.
- Add a mechanical guard (test-script under `scripts/`) that prevents this drift from recurring.
- Ship the user-visible fix for #385 in Phase 1B; everything after is architectural debt cleanup with no end-user behavior change.

**Non-Goals:**

- Public API changes (none of the affected hooks are public).
- Dexie schema migrations (data is unchanged).
- Touching `useWorkoutStore` or `useTrain2GoStore` — both are legitimately Zustand-only and unaffected.
- Replacing `dexie-react-hooks` or any other dependency.
- Adding a state-management library (Jotai, Recoil, etc.).
- Mechanical guards for PII in toasts or API-key-fragment leakage to logs. Documented as a follow-up under "Open Questions / Follow-ups."
- Cross-tab atomicity guarantees beyond what Dexie's `liveQuery` BroadcastChannel already provides. Same-tab atomic joins are guaranteed by D1; cross-tab is best-effort.

## Decisions

### D1. Read path: `useLiveQuery` directly against Dexie tables, with thin named hooks. `useActiveProfileLive` is a single composed query (atomic same-tab).

We expose hooks per entity, each a `useLiveQuery` over the Dexie tables:

```
useProfilesLive()           → useLiveQuery(() => db.table("profiles").toArray(), [])
useProfileByIdLive(id)      → useLiveQuery(() => db.table("profiles").get(id), [id])
useActiveProfileLive()      → SINGLE composed query (see below; atomic same-tab)
useLibraryTemplatesLive()   → src/hooks/use-library-templates-live.ts (existing useLibraryTemplates renamed and relocated)
useAiProvidersLive()        → useLiveQuery(() => aiProviderRepository.getAll(), []) — see D3
useAiCustomPromptLive()     → useLiveQuery(() => db.table("meta").get("ai_custom_prompt").then(r => r ? (r.value as string) : null), [])
```

**Atomic active-profile join.** Implementation:

```ts
useLiveQuery(async () => {
  const idRow = await db.table("meta").get("activeProfileId");
  const id = (idRow?.value ?? null) as string | null;
  const profile = id ? ((await db.table("profiles").get(id)) ?? null) : null;
  return { id, profile };
}, []);
```

Both reads execute inside the same `useLiveQuery` callback. Dexie evaluates the entire callback body inside an implicit per-callback read transaction (the callback is queued onto the Dexie transaction zone for its lifetime; mid-callback `await`s do not detach as long as they remain Dexie operations). Within one tab, this guarantees consumers never observe an intermediate state where `id` references a profile not yet present in `profiles`. **Cross-tab caveat**: Dexie's `liveQuery` propagates writes across tabs via BroadcastChannel; cross-tab joins are not transactional and may exhibit a one-frame intermediate state. This change explicitly does not test for cross-tab atomicity (out of scope); the spec scenario locks in same-tab atomicity only.

**Loading semantics.** `useLiveQuery` returns `undefined` while loading on first mount. Consumers SHALL treat `undefined` as the loading state (rendering a skeleton or "Loading…" message) and SHALL NOT confuse it with the empty-data state. For `meta`-table-backed live hooks (e.g., `useAiCustomPromptLive`), the missing-row case returns `null` (NOT `""`) so consumers can distinguish loading (`undefined`), missing (`null`), and empty (`""`).

**Render-frequency note.** `useLiveQuery` re-runs the callback on every observed table mutation. The hook returns a freshly constructed object literal each time, so referential equality breaks even when contents are unchanged. Two implications: (a) consumers gating expensive derivations must use `useMemo` keyed by stable fields (e.g., `id`, `profile?.updatedAt`); (b) the per-phase performance smoke (tasks `1B.5.2`, `3.7.2`) measures render counts on representative paths and gates on ≤2× pre-migration counts. We do NOT claim referential stability.

**Re-render frequency for `useProfileByIdLive`**: `db.table("profiles").get(id)` subscribes the live-query to the entire `profiles` table (Dexie liveQuery does not observe at row granularity for `.get()` queries — any mutation to the `profiles` table fires the observer). On each fire, `useLiveQuery` returns a freshly-hydrated `Profile` object even when the row content is unchanged, so React's `Object.is` does NOT suppress the re-render. Consequence: every `useProfileByIdLive` consumer re-renders on every profile-table mutation, regardless of whether the mutation affected the watched id. This is acceptable for this codebase (profiles are few; mutations rare; rendered subtrees are small) and is gated by the per-phase performance smoke task (`1B.5.2` measures render counts on the active-profile-change interaction and gates on ≤2× pre-migration). Consumers performing expensive derivations from the result MUST gate them with their own `useMemo` keyed on stable scalar fields (e.g., `profile?.id`, `profile?.updatedAt`).

### D2. Each phase migrates ONE store fully (reads + writes + delete legacy). Phase 1 is split into 1A (foundation) + 1B (high-risk + delete).

The rejected alternative was: Phase 1 migrates only reads, Phase 4 migrates writes. That structure leaves three production-visible regressions during the migration window:

1. **Write→read latency.** Legacy Zustand actions update Zustand sync (sub-frame), then fire-and-forget `persistState` to Dexie. After read migration, components re-render only when the Dexie observable fires — a perceptible delay between click and UI update.
2. **Silent write-failure swallowing.** `profile-store/persistence.ts:31-36`, `library-store/persistence.ts`, and `ai-store-persistence.ts:26-31` all `.catch(console.error)`. Currently masked because the Zustand mirror updates regardless. After read migration, a Dexie write failure produces no UI change AND no error toast.
3. **Cross-profile leakage during active-profile switch.** `setActiveProfile` updates Zustand sync (`activeProfileId = B`) and persists async. After read migration, components reading `useActiveProfileIdLive()` still see A until the Dexie write lands; any data scoped to active profile reads as profile A's while the user thinks they switched.

The chosen structure (read+write per phase) eliminates all three. Phase 1 is split internally because a single PR carrying live hooks + 9 use cases + transaction port + 8 read-site migrations + write migrations + 3 deletions is too large to review safely. The split:

- **Phase 1A (foundation, no user-visible change)**: extend `PersistencePort` with `transaction`; add live hooks; add the 9 application use cases (with the new `transaction` for multi-write atomicity); migrate the 4 lower-risk read sites (`ProfileEditView`, `LayoutHeader`, `TargetPicker`, `ZoneIndicator`) — only `ProfileEditView` has write callsites to migrate (the other three are read-only consumers). The legacy `useProfileStore` continues to back the 4 unmigrated sites; Phase 1A ships green and visually identical.
- **Phase 1B (high-risk + closes #385)**: migrate the remaining 4 read sites (`useProfileManager`, `useAiGeneration`, `useSportZoneEditor`, plus the `use-active-profile.ts` shim); add the #385 regression tests; delete `src/store/profile-store.ts`, `src/store/profile-store/`, `src/hooks/use-active-profile.ts`. This PR carries the user-visible fix.

**Multi-write atomicity via the port.** Multi-write use cases — `createProfile` (which conditionally writes both `profiles` AND `meta.activeProfileId` on the first profile), `deleteProfile` (which writes `profiles.delete` AND `meta.activeProfileId` clear-if-matching), and `removeProvider` (which deletes one provider AND promotes another to default in invariant I2) — wrap their writes in `await persistence.transaction(async () => { ... })`. The Dexie adapter implements this with `db.transaction("rw", db.tables, fn)`; the in-memory adapter implements it with snapshot/revert semantics on rejection (see D5). Failures bubble out of the use case as rejected promises; component callers `await` and surface via the toast context (`useToastContext().error(...)`).

**Layer impact:** application + adapter + ports. Domain unchanged.

**Trade-off accepted:** Phase 1A is a no-op for users (the bug stays until Phase 1B), but the two-PR split is what makes the reviewable Phase 1B carry only the high-risk delta. Reverting any single phase (1A, 1B, 2, 3, or 4) is safe.

### D3. AI store split (Phase 3): persisted slice via Dexie/useLiveQuery; runtime slice in a slimmed Zustand store. Provider invariants preserved by name.

`useAiStore` is the one store with mixed responsibilities:

| Field                                                                                                      | Today                                 | After Phase 3                                                    |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| `providers` (encrypted API keys)                                                                           | Zustand state, mirrored to Dexie      | `useAiProvidersLive` (Dexie observable + repo decryption)        |
| `customPrompt`                                                                                             | Zustand state, mirrored to Dexie meta | `useAiCustomPromptLive` (returns `null` on missing)              |
| `selectedProviderId`                                                                                       | Zustand state                         | `useAiRuntimeStore` (Zustand)                                    |
| `generation` (idle/loading/error/success)                                                                  | Zustand state                         | `useAiRuntimeStore` (Zustand)                                    |
| `hydrated` flag                                                                                            | Zustand state                         | removed (`undefined`-while-loading is the canonical signal)      |
| `addProvider`/`removeProvider`/`updateProvider`/`setDefaultProvider`/`setCustomPrompt`/`clearAllProviders` | Zustand actions                       | application use cases (`addProvider(persistence, config)`, etc.) |
| `selectForGeneration`/`setGeneration` (transient)                                                          | Zustand actions                       | `useAiRuntimeStore` actions                                      |

**Encryption-vs-reactivity pattern.** `dexie-ai-provider-repository` already encrypts API keys at rest (private `encryptProvider`/`decryptProvider`; `getAll()` returns plaintext after decryption). The live hook reads through the repository:

```ts
import { aiProviderRepository } from "../adapters/dexie"; // singleton, see below

export const useAiProvidersLive = () =>
  useLiveQuery(() => aiProviderRepository.getAll(), []);
```

How this stays consistent: `useLiveQuery` subscribes to every Dexie table read inside its callback. Inside `getAll()`, the implementation calls `await table().toArray()` (subscribes the live-query to the `aiProviders` table) and then `Promise.all(all.map(decryptProvider))`. `decryptProvider` is a non-Dexie WebCrypto await, but by then `toArray()` has already returned an immutable JS-memory snapshot of the ciphertext rows; the decryption operates on that snapshot. Concurrent writers cannot mutate the captured rows. So consistency comes from the JS-memory snapshot of `toArray()`, not from a Dexie transaction wrapper. We do NOT wrap the call in `db.transaction("r", ...)` — the wrapper would commit at the first WebCrypto await (Dexie transactions detach on non-Dexie microtasks), so it would not provide the atomicity it appears to provide. The simpler unwrapped form is correct AND `useLiveQuery` re-fires correctly on `aiProviders` writes (verified by an explicit test in 3.1.3).

Encryption-at-rest invariant: tests (3.1.3) verify both that `useAiProvidersLive()` returns plaintext `apiKey` matching the input AND that `db.table("aiProviders").get(id).apiKey` returns ciphertext.

**Singleton binding.** `aiProviderRepository = createDexieAiProviderRepository(db)` is exported from a barrel `adapters/dexie/index.ts`. Live hooks import the singleton (parity with the production binding pattern in D1). Tests that exercise the live hook use the same production singleton — fake-indexeddb backs `db` in tests (D5).

Note: under Vite HMR the module may re-evaluate, briefly producing two repository instances. Both close over the same `db` instance (also a module-level singleton imported from `dexie-database`), so reads and writes remain consistent across the brief overlap. Tests do not cover HMR explicitly because production builds are unaffected.

**Provider invariants — explicit and preserved by name.** The legacy Zustand `addProvider`/`removeProvider` actions encode three multi-step rules. Phase 3 splits them between persisted and runtime concerns:

| #   | Invariant                                                                                | New owner                                                                                                                                                                                                       | Test                                                                                                  |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| I1  | First added provider becomes `isDefault: true`                                           | `application/ai/add-provider.ts` (persisted) — sets `isDefault` if `getAll().length === 0` (wrapped in `persistence.transaction` to make the count-check + insert atomic against concurrent writers)            | `add-provider.test.ts` "first provider gets isDefault=true"                                           |
| I2  | Removing the default provider promotes the next provider to default                      | `application/ai/remove-provider.ts` (persisted) — within a `persistence.transaction`, deletes the target and sets `isDefault: true` on the next-in-list (if any)                                                | `remove-provider.test.ts` "removing default promotes next"                                            |
| I3  | Removing the currently-selected provider falls back to the default for runtime selection | `useAiRuntimeStore` consumer-side `useEffect` watching `useAiProvidersLive()` + `selectedProviderId`: when the selected id is no longer in the providers list, calls `selectForGeneration(default?.id ?? null)` | `useAiRuntimeStore.test.ts` "selectedProviderId falls back to default when current selection removed" |

I1 and I2 are atomic because they go through `persistence.transaction(...)`. I3 is reactive (one-frame transition is acceptable; documented as such in the consumer file). When `removeProvider(default-and-selected)` runs, I2 commits the new default in a single observable update; I3's effect then synchronously enqueues a runtime-store update for the new selection. React batches the I2-driven render and the I3-driven re-render before the next paint, so users perceive a single transition (not "the same render cycle" — there are technically two renders, batched). Note: "first provider becomes default + selected" — the legacy semantics also set `selectedProviderId` to the new provider on first add. That is reactively re-established by I3 (when `selectedProviderId === null` and a default exists, the I3 effect picks the default), so it does not need to be encoded in I1's persisted use case.

**Why split?** `useProfileStore` and `useLibraryStore` are 100% persisted entities — clean delete after migration. `useAiStore` has a real runtime slice (`generation` is a state machine for an in-flight LLM call; `selectedProviderId` is a UI selection). That slice must stay in Zustand. Trying to move it to Dexie would mean writing transient state to disk on every step of an LLM stream — wrong layer.

### D4. Mechanical guard (Phase 4): import-based static check.

`scripts/check-no-zustand-writethrough.mjs` runs under `pnpm test:scripts` (already in CI per `CLAUDE.md` repo-scripts policy). It performs **import-based** static checks:

For each `.ts` / `.tsx` file under `packages/workout-spa-editor/src/store/**` (excluding tests):

1. Parse the imports.
2. **Fail (rule R-DexieImport)** if the file imports from a path resolving to `adapters/dexie/dexie-database`, unless the file is on the allowlist. The script normalises imports through (a) relative paths, (b) `@/` and other tsconfig path aliases (parsed from the workspace `tsconfig.json`), (c) barrel re-exports (e.g., `import { db } from "../adapters/dexie"` where the barrel re-exports `db` from `dexie-database`), and (d) `await import(...)` dynamic imports.
3. **Fail (rule R-PersistStateImport)** if the file imports a sibling identifier named `persistState`, unless the file is on the allowlist.

The allowlist is hard-coded in the script:

```js
const ALLOWLIST = new Set([
  "src/store/workout-store-actions.ts", // Save-to-Library writes a template
  // Add others here ONLY for explicit-user-action writes from useWorkoutStore.
]);
```

A co-located `scripts/check-no-zustand-writethrough.test.mjs` (`node:test`) covers fixtures for: positive case (post-Phase-3 codebase passes); R-DexieImport relative path; R-DexieImport alias path (`@/...`); R-DexieImport barrel re-export; R-DexieImport dynamic import; R-PersistStateImport import; allowlist exemption.

**Why import-based and not action-body string match?** Lower false-positive rate. An import-based check is enough — if the store file imports neither `dexie-database` nor `persistState`, it cannot write through. New write-through patterns would have to add an import; that's the signal we catch.

**Layer impact:** tooling only. No runtime code affected.

### D5. Test infrastructure: production Dexie + fake-indexeddb (no custom subscribe machinery needed).

Tests today set Zustand state directly: `useProfileStore.setState({profiles: [...]})`. After this change, tests use the existing `fake-indexeddb/auto` setup (already loaded by `src/test-setup.ts`) to back the production Dexie singleton `db` with an in-memory IndexedDB implementation that fully implements the Dexie observable contract. There is no separate "in-memory live-query hook," no module mock of `dexie-react-hooks`, and no subscribe-on-mutation listener.

**Component test pattern (read + write):**

```tsx
import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistenceAdapter } from "../adapters/dexie";
import { PersistenceProvider } from "../contexts/persistence-context";

beforeEach(async () => {
  // Reset Dexie tables between tests; fake-indexeddb is in-memory so this is fast.
  await Promise.all([
    db.table("profiles").clear(),
    db.table("templates").clear(),
    db.table("aiProviders").clear(),
    db.table("meta").clear(),
    // ... other tables touched by tests
  ]);
});

test("createProfile shows up in Profile Manager", async () => {
  const persistence = createDexiePersistenceAdapter(db);

  render(
    <PersistenceProvider persistence={persistence}>
      <ProfileManager />
    </PersistenceProvider>
  );

  // Trigger the use case via the component
  await user.type(screen.getByPlaceholderText(/new profile name/i), "Pablo");
  await user.click(screen.getByRole("button", { name: /create profile/i }));

  // useLiveQuery re-fires automatically because fake-indexeddb implements the
  // Dexie observable contract; component re-renders with the new profile.
  await screen.findByText("Pablo");
});
```

**Use-case unit test pattern (no React, no live queries):**

```ts
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";

test("createProfile rolls back on partial failure", async () => {
  const persistence = createInMemoryPersistence();
  // Inject a rejecting setActiveId
  persistence.profiles.setActiveId = () =>
    Promise.reject(new Error("simulated"));

  await expect(createProfile(persistence, "Pablo")).rejects.toThrow(
    "simulated"
  );

  expect(await persistence.profiles.getAll()).toEqual([]);
  expect(await persistence.profiles.getActiveId()).toBeNull();
});
```

The in-memory adapter (`createInMemoryPersistence()`) remains useful for use-case unit tests where reactivity is irrelevant. To support the new `transaction` port method, the in-memory adapter implements snapshot/revert: before invoking `fn`, capture each repo's full state via the existing accessors (`getAll()`, `getActiveId()`, etc.) into local closures; on `fn` resolution commit (drop the snapshots); on `fn` rejection restore state via `put` / `delete` / `setActiveId` calls and re-throw.

**Test-pattern table:**

| Test type                                        | Backing                                                     | Reactivity                    |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------- |
| Component / hook (render + assert UI)            | `db` + fake-indexeddb (loaded by `test-setup.ts`)           | yes — `useLiveQuery` re-fires |
| Use case unit test (no React)                    | `createInMemoryPersistence()`                               | n/a — direct repo calls only  |
| Use case integration test (no React, real Dexie) | `createDexiePersistenceAdapter(db)` (fake-indexeddb-backed) | n/a — direct repo calls only  |

**Layer impact:** test utilities only. Production code unchanged. No new test infrastructure required because fake-indexeddb already provides what we need.

### D6. Sequencing.

Phase 1A → 1B → 2 → 3 → 4. Phase 1A lands first to extend the port and validate the migration pattern with no user-visible regression risk. Phase 1B carries the production bug fix once the pattern is proven. Phase 2 reuses the pattern on the simplest store. Phase 3 extends the pattern with a store split. Phase 4 ships only after Phase 3 because its mechanical guard would block earlier phases otherwise.

Each phase ships as one PR with its own changeset (Phase 1A uses `none` because it has no user-visible change; the others use `patch`). All five phases land before the change is archived.

## Risks / Trade-offs

- **[Risk]** `useLiveQuery` returns `undefined` on first render. Components may flash an empty/loading state where they previously read sync from Zustand.
  → **Mitigation**: each migration site renders an explicit loading fallback (skeleton or "Loading…") gated on `data === undefined`. The fallback is verified by an a11y smoke task per phase. Existing tests that asserted "shows N profiles" become "renders Loading then shows N profiles" via `findByText`.

- **[Risk]** Render-frequency change: Zustand selectors with `find(...)` re-rendered only on relevant slice change; `useLiveQuery` re-renders on any table mutation, and returns fresh object identities.
  → **Mitigation**: per-phase performance smoke task using React Profiler on representative critical paths (CalendarPage with 4 weeks of data; AiWorkoutInput with active profile changes). Render counts after migration MUST NOT exceed 2× the pre-migration counts. Consumers gating expensive derivations must use `useMemo` keyed by stable fields. We do NOT rely on referential stability of the `useLiveQuery` return value.

- **[Risk]** Phase 3 store split changes the public-ish API of `useAiStore` (callers expect `providers` and `addProvider` on one object).
  → **Mitigation**: 7 consumer files; mechanical migration. Risk is regression in error handling (Zustand `addProvider` was sync; the use-case version is async). Each consumer-site migration includes a test verifying the success path AND a test verifying that a rejected promise from the use case surfaces via the existing toast/error system.

- **[Risk]** Phase 3 must preserve three multi-step provider invariants (I1–I3 in D3).
  → **Mitigation**: D3 names each invariant, assigns ownership (use case vs runtime store), and pairs each with a test. The transaction port from Phase 1A makes I1 and I2 atomic.

- **[Risk]** Phase 4 mechanical guard produces false positives or misses obfuscated import paths.
  → **Mitigation**: import-based check (D4) with explicit fixtures for relative, alias, barrel-re-export, and dynamic-import shapes. If a legitimate exception arises (a new explicit-user-action write path in `useWorkoutStore`), add the file to the allowlist with a one-line comment explaining why. The list is short (1 entry today) and reviewed in PRs.

- **[Risk]** Multi-write atomicity. Today's `persistState` does `Promise.all([profileTable.bulkPut, metaTable.put])` with no transaction; either could fail independently. After migration, multi-write use cases (e.g., `createProfile` writing both `profiles` and `meta.activeProfileId`) inherit the same risk if not wrapped.
  → **Mitigation**: each multi-write use case wraps its writes in `await persistence.transaction(...)` (added to `PersistencePort` in Phase 1A; Dexie adapter wraps `db.transaction("rw", db.tables, fn)`; in-memory adapter snapshots/reverts). Failure modes are documented in each use case's JSDoc and exercised by a unit test.

- **[Risk]** Cross-tab atomicity. Dexie's `liveQuery` BroadcastChannel propagates writes across tabs but does not transactionally coordinate joins.
  → **Mitigation**: explicitly out of scope. D1 documents same-tab atomicity only; spec scenario 3 ("Active profile join is observed atomically") is a same-tab scenario. Cross-tab atomicity is acceptable as "best-effort" for this codebase; revisit if multi-tab usage becomes a primary scenario.

- **[Trade-off]** No backwards-compat shim during the migration. A component cannot temporarily read from both Zustand and Dexie. Each migration site swaps in one PR with its tests. Phase 1A and 1B together are the exception: 1A leaves 4 sites on Zustand and 4 on Dexie simultaneously, both backed by the SAME persisted data (Zustand actions still write through `persistState` to the SAME Dexie tables that the live hooks read). The two read paths produce equivalent UI for the legacy 4 sites; 1B completes the migration.

- **[Trade-off]** Phase 1A is a no-op for users. The two-PR split sacrifices one PR's user-visible value for review reviewability — the alternative was a single ~50-item PR that no one could review safely.

## Migration Plan

Single direction; each phase is independently revertable because phases land in dependency order.

1. **Phase 1A PR** — `transaction` port + adapters + in-memory snapshot + live hooks + 9 use cases + 4 lower-risk read-site migrations (only `ProfileEditView` has write callsites to migrate; the other 3 sites are read-only). No user-visible change. No deletions. Ship + verify CI green.
2. **Phase 1B PR** — 4 high-risk read-site migrations + write migrations + #385 regression tests + delete `profile-store/` + delete `use-active-profile.ts`. Closes #385. Ship + verify in production.
3. **Phase 2 PR** — same pattern for library: rename `useLibraryTemplates` → `useLibraryTemplatesLive`; migrate 4 consumer files; promote 3 write actions; delete `library-store/`. Ship + verify.
4. **Phase 3 PR** — store split: 2 persisted live hooks + 1 runtime store + 6 use cases; migrate 7 consumer files; preserve I1–I3 invariants; delete legacy ai-store. Ship + verify.
5. **Phase 4 PR** — mechanical guard script + co-located test; final dead-code sweep. Ship + final verify.

Rollback per phase: `git revert <merge-sha>`. Each phase is independently revertable because phases land in dependency order — reverting a later phase never strands an earlier one.

## Open Questions / Follow-ups

All design questions are resolved in this document; the items below are deliberately out-of-scope follow-ups.

- **Follow-up: PII / secret-leakage mechanical guard.** This change adds a guard for Zustand-to-Dexie writes. A complementary guard for "no `externalUserId` / `externalUserName` / API-key fragment in toast strings or `console.*` calls" is a separate hardening initiative. **TODO(before-archive)**: task `5.4.2` opens the follow-up issue after Phase 4 lands; replace this `TODO(before-archive)` marker with the issue URL at archive time.
- **Follow-up: cross-tab atomicity.** Same-tab joins are atomic (D1); cross-tab is best-effort. If multi-tab usage of the editor becomes a primary scenario, design and ship a separate change that adds `BroadcastChannel`-based coordination at the join level (e.g., a "profile updated in another tab" toast or last-write-wins reconciliation).

**Resolved decisions captured here for future readers (keyed to D1–D5):**

- **D1.1** Live hooks live at `src/hooks/use-*-live.ts` (one file per entity, ≤100 LOC each).
- **D1.2** `useLibraryTemplates` is renamed to `useLibraryTemplatesLive` and relocated to `src/hooks/use-library-templates-live.ts`.
- **D1.3** Live hooks bind to the production Dexie singleton `db` directly. In tests, `db` is backed by fake-indexeddb (loaded by `src/test-setup.ts`) which fully implements the Dexie observable contract — no module mock or test-only hook is required.
- **D1.4** `meta`-table-backed live hooks (e.g., `useAiCustomPromptLive`) return `null` for the missing-row case, NOT `""`, so consumers can distinguish loading (`undefined`), missing (`null`), and empty (`""`).
- **D2.1** `customPrompt` writes go through a `setCustomPrompt(persistence, value)` use case for consistency with the no-direct-port-call rule, even though it could plausibly call the repository directly.
- **D2.2** Multi-write atomicity is provided via `persistence.transaction(fn)`, added to `PersistencePort` in Phase 1A.
- **D3.1** `aiProviderRepository = createDexieAiProviderRepository(db)` is exported from `adapters/dexie/index.ts` as a singleton; live hooks import from there.
- **D3.2** Provider invariants I1, I2 are owned by use cases (atomic via transaction); I3 is owned by a `useEffect` in the runtime store consumer (reactive, one-frame transition acceptable).
- **D3.3** No explicit `db.transaction("r", ...)` wrapper for `useAiProvidersLive` — the wrapper would commit at the first WebCrypto await; consistency comes from the JS-memory snapshot returned by `toArray()`.
- **D4.1** The mechanical guard scope is `packages/workout-spa-editor/src/store/**` only. Other packages have no Zustand stores today; if they grow them, the script's path glob is configurable.
- **D5.1** Component / hook tests use the production Dexie singleton `db` (fake-indexeddb-backed in jsdom). No subscribe-on-mutation listeners; no module mocks of `dexie-react-hooks`. Use cases tests use either `createInMemoryPersistence()` (no React) or `createDexiePersistenceAdapter(db)` (real Dexie via fake-indexeddb).
