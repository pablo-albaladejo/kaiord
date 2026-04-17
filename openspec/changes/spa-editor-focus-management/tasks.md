## 1. Foundations: branded ItemId, IdProvider port, jsdom check

- [ ] 1.0.a Verify jsdom version in `packages/workout-spa-editor` supports `crypto.randomUUID` (jsdom ≥20); if not, upgrade or add a polyfill in the default `IdProvider`
- [ ] 1.0.b Write failing test asserting the branded `ItemId` type prevents assigning a plain positional string without an `asItemId()` cast (type-level test via `expectTypeOf` or a `// @ts-expect-error` assertion)
- [ ] 1.0.c Implement `ItemId` branded type and `asItemId(s: string): ItemId` helper in `src/store/providers/item-id.ts`
- [ ] 1.1.a Write failing test for `defaultIdProvider()` asserting it returns a UUID v4 string and is unique over 10k calls
- [ ] 1.1.b Implement `IdProvider` in `src/store/providers/id-provider.ts` with branching: prefer `crypto.randomUUID()`; fall back to a v4 UUID composed from `crypto.getRandomValues()` bytes; never use `Math.random`
- [ ] 1.1.c Write failing test asserting the fallback path is taken when `crypto.randomUUID` is undefined (mocked via `vi.stubGlobal('crypto', { getRandomValues: ... })`) and produces a valid v4 string
- [ ] 1.1.d Refactor to allow store construction to accept an optional `IdProvider` for deterministic tests

## 2. In-memory state rename: KRD → UIWorkout with id fields (ATOMIC PR)

> This task group is a single atomic PR. `currentWorkout: KRD` → `currentWorkout: UIWorkout` is a type-breaking change across every action creator; intermediate commits would fail `pnpm -r build`, violating the zero-warning invariant. All 2.x tasks land together.

- [ ] 2.0.a Write failing test asserting `loadWorkout(krd)` produces a `UIWorkout` where every step and block has a unique `ItemId`
- [ ] 2.0.b Canonicalize `UIWorkout` in `src/types/krd-ui.ts` as `KRD` plus `id: ItemId` on every step/block; re-export `UIWorkout`, `WorkoutStepWithId`, `RepetitionBlockWithId` from `src/store/workout-state.types.ts` for store-local imports
- [ ] 2.0.c Update `WorkoutStore.currentWorkout` and `workoutHistory` typings to `UIWorkout`; update every action creator that constructs a workout to produce `id` fields in the same PR
- [ ] 2.0.d Implement `loadWorkout` to assign fresh IDs via the injected `IdProvider`
- [ ] 2.1.a Write failing tests for `createStep`, `createEmptyRepetitionBlock`, `addStepToRepetitionBlock`, `duplicateStep`, `duplicateStepInRepetitionBlock`, and `pasteStep` asserting each new item carries a fresh distinct `ItemId`
- [ ] 2.1.b Implement id assignment in each action to pass its test
- [ ] 2.2.a Write failing test asserting `undoDelete` and the `undo`/`redo` reducers preserve the `ItemId` captured in history snapshots (delete → undo → redo cycle returns the same `ItemId`)
- [ ] 2.2.b Implement id preservation; ensure history stores `UIWorkout` snapshots (not stripped `KRD`)
- [ ] 2.3 Verify `pnpm lint && pnpm -r build && pnpm -r test` is clean at the PR head (not at individual commits, since this task group ships atomically)

## 3. Strip IDs before conversion ports and Dexie writes

- [ ] 3.1.a Write failing unit test on the SPA's export wrapper asserting that after `stripIds(uiWorkout)` the returned payload has no `id` property on any step or block
- [ ] 3.1.b Implement `stripIds(uiWorkout): KRD` in `src/store/strip-ids.ts` that deep-copies and removes `id` fields
- [ ] 3.1.c Parameterize a conversion-export test across formats the SPA uses (KRD + any adapters wired in): assert no `id` values leak into the conversion port input; include a compile-time type assertion `expectTypeOf<ReturnType<typeof stripIds>>().not.toHaveProperty('id')` on an arbitrary step/block picked from the returned workout, so the seam is enforced at type-check time as well as runtime
- [ ] 3.2.a Write failing test asserting every Dexie write path (e.g., `saveWorkout`, `saveTemplate`) calls `stripIds` before persisting so stored blobs contain no `id` fields
- [ ] 3.2.b Refactor Dexie write paths to pass through `stripIds`
- [ ] 3.2.c Write failing Dexie integration test: save → reload → stored record has no `id` field on any step/block
- [ ] 3.3 Verify `@kaiord/core`'s `KRD` Zod schema either uses `.strict()` (rejects unknown properties) OR document in `src/store/strip-ids.ts` that extra properties pass through silently and the SPA's `stripIds` test is the only gate; if the latter, add a structural-equality assertion (`JSON.stringify(stripped) === JSON.stringify(expectedKrd)`) to task 3.1.c

## 4. Focus target state + selection history

- [ ] 4.0.a Write failing tests for `FocusTarget` discriminated union (`{ kind: 'item'; id: ItemId }` | `{ kind: 'empty-state' }`) ensuring type narrowing works at call sites
- [ ] 4.0.b Define `FocusTarget` in `src/store/focus/focus-target.types.ts` (new file, separate from the monolith to respect ≤100 line rule)
- [ ] 4.1.a Write failing test: `setPendingFocusTarget(null)` → state reads null; set then set again → state reads latest; set to non-existent id → state accepts the value without throwing
- [ ] 4.1.b Extend `WorkoutStore` by composing a `FocusSlice` that adds `pendingFocusTarget: FocusTarget | null` and `setPendingFocusTarget(target)`; keep each types file ≤100 lines by splitting `workout-store-types.ts` into `workout-store-state.types.ts`, `workout-store-actions.types.ts`, `workout-store-focus.types.ts` if needed
- [ ] 4.1.c Implement the slice in `src/store/focus/focus-slice.ts` (actions <40 LOC each)
- [ ] 4.2.a Write failing test: after any mutation pushing a snapshot, `selectionHistory.length === workoutHistory.length` and last entry equals `selectedStepId` immediately before the mutation
- [ ] 4.2.b Introduce a single `pushHistorySnapshot(uiWorkout, selection)` helper in `src/store/workout-store-history.ts`; refactor every mutating action to call it instead of pushing to `workoutHistory` directly; include a code comment: `// DO NOT capture pendingFocusTarget here — undo/redo compute focus targets at dispatch time via focus-rule helpers.`
- [ ] 4.2.c Add a dev-mode runtime assertion: `if (process.env.NODE_ENV !== 'production' && workoutHistory.length !== selectionHistory.length) console.error(...)`; write test covering the assertion path
- [ ] 4.2.d Write a lint rule or grep-based invariant check (CI step) asserting `workoutHistory.push` appears only inside `pushHistorySnapshot`

## 5. Pure focus-rule helpers (one function per file)

- [ ] 5.1.a Write failing tests for `nextAfterDelete` covering: main-list next sibling, main-list previous sibling, main-list empty-state, block-child next sibling, block-child previous sibling, block-child last-remaining (cascade to parent block deletion)
- [ ] 5.1.b Implement `nextAfterDelete(workout, deletedItemId, parentBlockId?)` in `src/store/focus-rules/next-after-delete.ts`
- [ ] 5.2.a Write failing tests for `nextAfterMultiDelete` covering: items remaining after last-deleted, items remaining only before first-deleted, empty list; non-contiguous selection case
- [ ] 5.2.b Implement `nextAfterMultiDelete(workout, deletedIds, parentBlockId?)` in `src/store/focus-rules/next-after-multi-delete.ts`
- [ ] 5.3.a Write failing test for `createdItemTarget(newItemId)` returning `{ kind: 'item', id: newItemId }`
- [ ] 5.3.b Implement `createdItemTarget` in `src/store/focus-rules/created-item.ts`
- [ ] 5.4.a Write failing test for `restoredAfterUndoTarget(workout, restoredItemId)`
- [ ] 5.4.b Implement in `src/store/focus-rules/restored-after-undo.ts`
- [ ] 5.5.a Write failing tests for `preservedSelectionTarget` covering: prior selection still present, prior selection absent → same-index fallback, no item at index → empty-state
- [ ] 5.5.b Implement in `src/store/focus-rules/preserved-selection.ts`
- [ ] 5.6.a Add barrel `src/store/focus-rules/index.ts` re-exporting all helpers
- [ ] 5.6.b Verify `wc -l` reports ≤100 lines for every file in `src/store/focus-rules/` and every function <40 LOC
- [ ] 5.6.c Add CI grep invariant: `grep -R -E "from ['\"]react|document\\.|window\\.|HTMLElement" packages/workout-spa-editor/src/store/focus-rules/` returns zero matches (purity constraint per design Decision 4)

## 6. Wire focus rules into mutating actions

- [ ] 6.1.a Write failing tests for `deleteStep` and `deleteRepetitionBlock` asserting `pendingFocusTarget` is set correctly for next-sibling, previous-sibling, main-list empty-state, and block-cascade branches
- [ ] 6.1.b Implement focus-rule wiring in delete actions
- [ ] 6.2.a Write failing tests for a multi-select delete action asserting the multi-delete rules (contiguous selection, non-contiguous selection, delete-all)
- [ ] 6.2.b Implement or extend the multi-delete action to wire the rule
- [ ] 6.3.a Write failing test for `pasteStep` asserting `pendingFocusTarget` equals the freshly-regenerated pasted item id
- [ ] 6.3.b Implement
- [ ] 6.3.c Write failing test asserting `pasteStep` parses clipboard content through the step / repetition-block Zod schema and rejects malformed payloads with an error toast and no store mutation
- [ ] 6.3.d Write failing test asserting `pasteStep` overwrites every `id` field on the validated payload via `IdProvider` before writing to the store; test with a clipboard payload whose step carries `id` equal to an existing step's id asserts the pasted step receives a different id and `pendingFocusTarget.id` is neither the attacker-supplied id nor the existing step's id
- [ ] 6.3.e Implement the validation + id-regeneration in `pasteStep` ahead of the store mutation and focus-target set
- [ ] 6.4.a Write failing tests for `createStep`, `createEmptyRepetitionBlock`, `addStepToRepetitionBlock` asserting target equals new item id
- [ ] 6.4.b Implement
- [ ] 6.5.a Write failing tests for `duplicateStep`, `duplicateStepInRepetitionBlock` asserting target equals duplicate id
- [ ] 6.5.b Implement
- [ ] 6.6.a Write failing test for `createRepetitionBlock` asserting target equals new block id
- [ ] 6.6.b Implement
- [ ] 6.7.a Write failing test for `ungroupRepetitionBlock` asserting target equals first formerly-child step's id at its new position
- [ ] 6.7.b Implement
- [ ] 6.8.a Write failing test for `editRepetitionBlock` asserting `pendingFocusTarget` is unchanged
- [ ] 6.8.b Verify implementation leaves target alone
- [ ] 6.9.a Write failing test for `clearWorkout` asserting `pendingFocusTarget` is set to null
- [ ] 6.9.b Implement
- [ ] 6.10.a Write failing test for `undoDelete` asserting target equals restored item id
- [ ] 6.10.b Implement
- [ ] 6.11.a Write failing tests for `undo` (of add, paste, duplicate, group, ungroup) using `selectionHistory` fallback rules
- [ ] 6.11.b Implement
- [ ] 6.12.a Write failing tests for `redo` asserting it re-applies the forward rule's focus target
- [ ] 6.12.b Implement
- [ ] 6.13.a Write failing tests for `reorderStep`, `reorderStepsInBlock`, and drag-and-drop drop handler asserting target equals moved item id at new position
- [ ] 6.13.b Implement

## 7. FocusRegistryContext and useFocusAfterAction hook

- [ ] 7.1.a Write failing test for `FocusRegistryContext` asserting `registerItem(id, el)` is idempotent, `unregisterItem(id, el)` only deletes when identity matches (Strict Mode remount guard), and the `value` reference is identical across re-renders without registry changes
- [ ] 7.1.b Implement `FocusRegistryContext` in `src/contexts/focus-registry-context.tsx` using `useRef<Map<ItemId, HTMLElement>>` for storage and `useMemo`/`useCallback` for stable `value`
- [ ] 7.2.a Write failing hook test using `@testing-library/react` + `useLayoutEffect`: set `pendingFocusTarget` → after `act()` returns, `document.activeElement` equals the registered element and `pendingFocusTarget` is null
- [ ] 7.2.b Implement `useFocusAfterAction` in `src/hooks/use-focus-after-action.ts` with a `prevTarget` ref guarding re-application; subscribe via narrow selector `(s) => s.pendingFocusTarget` (reference equality)
- [ ] 7.2.c Write failing test asserting the hook's layout effect does NOT re-run when unrelated store keys change (e.g., `selectedStepId` changes while `pendingFocusTarget` is null)
- [ ] 7.3.a Write failing test asserting the hook short-circuits when `document.activeElement` is an input/textarea/select/contentEditable inside the editor — `pendingFocusTarget` is cleared without moving focus
- [ ] 7.3.b Implement the form-field guard
- [ ] 7.4.a Write failing test asserting the hook defers focus while a `[role="dialog"][data-state="open"]` or `[role="menu"][data-state="open"]` is present inside the editor root, and applies the most recent target when overlays close
- [ ] 7.4.b Implement `overlayObserver` scoped to the editor root element (obtained via a ref registered by `WorkoutList`), NOT `document.body`; the callback filters to `target.matches('[role="dialog"],[role="menu"]')` with a `data-radix-*` attribute; expose a `subscribe(rootEl, callback)` API
- [ ] 7.4.b1 Write failing test asserting a foreign `<div role="dialog" data-state="open">` injected outside the editor root does NOT trigger the overlay guard (availability DoS mitigation)
- [ ] 7.4.c Implement the overlay-open guard in `useFocusAfterAction`: subscribe to the observer; when count transitions from >0 to 0, schedule `requestAnimationFrame(() => applyTarget(currentTarget))`
- [ ] 7.4.d Write test asserting the close-overlay path fires focus within one animation frame using fake timers
- [ ] 7.4.e Implement ref-counted singleton lifecycle: lazy-create on first `subscribe()`, `disconnect()` on last `unsubscribe()`; keep the singleton in a module-scoped `let` in production; only when `process.env.NODE_ENV === 'test'` additionally mirror it to `globalThis.__kaiord_overlayObserver__` so Vitest module-reset cycles share a reference; write test asserting the `globalThis` handle is undefined in a production-mode build
- [ ] 7.4.f Expose a test-only reset hook `__resetOverlayObserverForTests()` that disconnects and nulls the singleton; add a Vitest setup file (`src/test-setup.ts`) that invokes it in `beforeEach`; write parallel test-file smoke test asserting two files each see a fresh observer
- [ ] 7.4.g Write failing test asserting that when `MutationObserver` is undefined (`vi.stubGlobal('MutationObserver', undefined)`), the overlay guard assumes zero overlays, emits exactly one dev-mode warning, and does not throw
- [ ] 7.9.a Write failing tests documenting canonical `flushSync` boundaries: (i) paste-then-continuation reads committed state, (ii) delete-then-continuation, (iii) paste-inside-dialog-continuation
- [ ] 7.9.b Implement the three canonical patterns in `src/store/README.md` with runnable code snippets
- [ ] 7.9.c Add a code comment at every production `flushSync` call site referencing the README section
- [ ] 7.5.a Write failing test asserting unresolved target fallback order: main-list empty-state button → first registered item → labelled editor `<h2 tabIndex={-1}>` heading; dev-only `console.warn` emitted; focus NEVER lands on a bare `role="list"` container
- [ ] 7.5.b Implement the fallback chain
- [ ] 7.6.a Write failing test asserting `focus({ preventScroll: true })` is used and a single `scrollIntoView({ block: 'nearest', behavior })` is called when the target is off-screen, with `behavior === 'instant'` when `prefers-reduced-motion: reduce` and `'auto'` otherwise
- [ ] 7.6.b Implement with `window.matchMedia('(prefers-reduced-motion: reduce)').matches` check; wrap the `focus()` + `scrollIntoView()` calls in `try { ... } finally { setPendingFocusTarget(null); prevTarget.current = currentTarget }`; additionally wrap `scrollIntoView` in its own try/catch to swallow legacy `TypeError` from the options-object form
- [ ] 7.6.a1 Write failing test asserting that when `element.focus()` throws (simulated via `Object.defineProperty(el, 'focus', { value: () => { throw new Error() } })`), `pendingFocusTarget` is cleared to null AND the hook does not re-invoke focus on the next render (no retry storm)
- [ ] 7.6.a2 Write failing test asserting that when `scrollIntoView` throws (legacy browser simulation), the focus move still succeeds and `pendingFocusTarget` is cleared
- [ ] 7.6.c Write failing test asserting the focus + scroll calls are wrapped in `setTimeout(fn, 0)` so a concurrent `role="status"` toast update is queued in the AT speech pipeline first; verify ordering with fake timers
- [ ] 7.6.d Write failing test asserting reorder of an already-focused item does not cause `scrollIntoView` to fire redundantly (prevTarget guard)
- [ ] 7.7.a Write failing test asserting rapid sequential mutations (three `setPendingFocusTarget` calls in one `act()`) produce exactly one `focus()` call, targeting the final value
- [ ] 7.7.b Verify the `prevTarget` guard and Zustand batching produce this behavior; adjust if needed
- [ ] 7.8.a Write failing test asserting no render loop when clearing in the same commit that another action re-sets the target
- [ ] 7.8.b Verify implementation

## 8. Component integration

- [ ] 8.1.a Write failing integration test wrapping `WorkoutList` in `FocusRegistryContext.Provider`, triggering each mutation type (delete, paste, add, duplicate, undo, redo, reorder, group, ungroup, multi-delete), and asserting `document.activeElement` after each
- [ ] 8.1.b Wire `FocusRegistryContext.Provider` and `useFocusAfterAction` into `WorkoutList`
- [ ] 8.2.a Write failing test asserting `StepCard` registers its root DOM node on mount and unregisters on unmount
- [ ] 8.2.b Update `StepCard` to accept `id: ItemId`, call `registerItem(id, ref.current)` on mount via a `useEffect` (registration, not focus), set `tabIndex={-1}` if not otherwise tabbable
- [ ] 8.3.a Write failing test for `RepetitionBlockCard` registration contract
- [ ] 8.3.b Update `RepetitionBlockCard` accordingly
- [ ] 8.4.a Write failing test asserting the main-list empty-state component is resolvable by the hook (registered under a reserved id or via a dedicated ref)
- [ ] 8.4.b Wire the empty-state registration
- [ ] 8.4.c Write failing test asserting that when the step list transitions from 1 item to 0 items inside a single `act()`, the empty-state button is mounted in the same commit (no `waitFor`, no Suspense boundary above it) so the focus target resolves synchronously
- [ ] 8.5.a Write failing test asserting the editor's labelled `<h2 tabIndex={-1}>` heading receives focus as the last-resort fallback
- [ ] 8.5.b Add the heading and its registration
- [ ] 8.6.a Add visual/E2E check (or a snapshot of computed style) asserting `:focus-visible` ring applies after programmatic focus in Chrome, Firefox, and Safari
- [ ] 8.6.b Ensure `StepCard`, `RepetitionBlockCard`, empty-state button, and the editor `<h2 tabIndex={-1}>` fallback heading all apply the same outline via both `:focus` and `:focus-visible`
- [ ] 8.6.c Write failing test (jsdom `getComputedStyle` with matchMedia mock, or Playwright with `--forced-colors`) asserting `transition` / `animation` properties on `:focus-visible` evaluate to `none` when `prefers-reduced-motion: reduce` is active
- [ ] 8.7.a Write failing test asserting `Tab` from a programmatically-focused `tabIndex={-1}` step card moves to the next focusable element outside the step list
- [ ] 8.7.b Write failing test asserting `Shift+Tab` from a programmatically-focused step card moves to the previous focusable element outside the list
- [ ] 8.7.c If the existing tab-order contract places focusables inside the list (e.g., inline edit buttons), document the expected behavior and update the tests accordingly
- [ ] 8.8.a Write failing selection-model test asserting multi-selection cannot span the main list and the inside of a repetition block (selection is replaced rather than extended)
- [ ] 8.8.b Enforce the single-parent selection invariant in `toggleStepSelection` and range-selection logic

## 9. Consumer migration to stable IDs

- [ ] 9.1.a Write failing tests asserting `selectedStepId`, `selectedStepIds`, `selectStep`, `toggleStepSelection`, and `selectAllSteps` use stable `ItemId` values
- [ ] 9.1.b Migrate selection actions and their call sites
- [ ] 9.2.a Write failing tests asserting `use-workout-list-dnd.ts` keys DnD items by stable `ItemId` rather than positional `step-${stepIndex}` strings
- [ ] 9.2.b Migrate DnD id generation and update affected tests
- [ ] 9.3.a Write failing tests for `use-editor-context-menu.ts` and `keyboard-shortcut-handlers.ts` asserting they look up steps by stable id via a new `findById(workout, id)` helper
- [ ] 9.3.b Migrate the lookups
- [ ] 9.3.c Run `/opsx-verify spa-editor-context-menu` after the migration to confirm all existing shortcut-spec scenarios still pass
- [ ] 9.4.a Write failing tests for `flatten-steps.ts` in `components/molecules/WorkoutPreview/` asserting it uses stable IDs
- [ ] 9.4.b Migrate
- [ ] 9.5.a Verify no consumers remain: `git grep 'step-id-parser\|parseStepId\|reconstructStepId'` returns zero matches outside the files being deleted
- [ ] 9.5.b Delete the positional-ID generator module `step-id-parser.ts` and its test file `step-id-parser.test.ts` — the test file is removed because the functionality it covered is removed from the codebase (not silenced; the "never delete a test" rule applies to tests for retained code)
- [ ] 9.5.c Remove positional-ID generation in `repetition-block-steps.types.ts`; confirm `pnpm -r build` and `pnpm lint` stay clean
- [ ] 9.5.d Document in the PR description that the deletion removes dead tests alongside dead code, not behavior-test-silencing

## 10. Spec and documentation updates

- [ ] 10.1 Apply the `spa-editor-focus-management` and `spa-editor-context-menu` spec deltas by moving files from this change to `openspec/specs/`; confirm the "> **Future enhancement** ..." note no longer appears in the applied `spa-editor-context-menu/spec.md`
- [ ] 10.2 Update `packages/workout-spa-editor/src/components/organisms/WorkoutList/README.md` to document the stable-ID contract, the focus registry, and the form-field/overlay guards
- [ ] 10.3 Update `packages/workout-spa-editor/src/store/README.md` to document `pendingFocusTarget`, `selectionHistory`, the focus-rule helpers, the `stripIds` chokepoint, and — critically — the narrow-selector discipline ("consumers of `pendingFocusTarget` MUST subscribe with `s => s.pendingFocusTarget`, not a wide selector")
- [ ] 10.3.a Add CI grep invariant: `grep -R "useWorkoutStore(\s*)" packages/workout-spa-editor/src | grep -v "pendingFocusTarget\|useWorkoutStore((s)"` helps locate suspicious wide subscriptions that also reference `pendingFocusTarget`; add a codeword comment near approved wide subscriptions to allow-list them
- [ ] 10.3.b Add CI grep invariant asserting no `persist(` appears in any file that imports `UIWorkout` from the store types

## 11. Quality gates

- [ ] 11.1 Run `pnpm -r test` — all tests pass, zero test warnings
- [ ] 11.2 Run `pnpm lint` — zero errors, zero warnings (includes no-warnings policy)
- [ ] 11.3 Run `pnpm -r build` — zero build warnings
- [ ] 11.4 Run `find packages/workout-spa-editor/src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.ts' ! -name '*.test.tsx' -exec wc -l {} \; | awk '$1 > 100 && $2 != "total"'` — zero rows; verify all new functions <40 LOC by inspection. The `-exec ... \;` form (one-file-per-invocation) avoids `wc`'s aggregate `total` row that `-exec ... {} +` produces, which would otherwise false-positive as a >100 LOC file
- [ ] 11.5 Manual verification in the dev server: delete (single + multi-select contiguous + non-contiguous), paste, duplicate, add, undo, redo, reorder, group, ungroup via keyboard, context menu, toolbar, and DnD; confirm focus lands on the correct element in each case
- [ ] 11.6 Manual verification with VoiceOver (macOS) and NVDA (Windows) that the toast `role="status"` announcement is not truncated by the focus move; record the evidence (transcript or screenshot of Accessibility Inspector) and attach to the PR
- [ ] 11.7 Manual verification in Safari that programmatic focus produces a visible `:focus-visible` ring on step cards, block cards, and the empty-state button
- [ ] 11.8 Manual verification in React Strict Mode (dev build) that mutations do not produce duplicate focus calls or dropped registrations
- [ ] 11.9 Add a new `focus-invariants` job to `.github/workflows/ci.yml` (or extend the existing lint job) running the four CI grep invariants as required checks. Each command MUST exit non-zero if it produces any matching line. Job steps:
  ```yaml
  - name: Focus-rules purity (no React/DOM imports)
    run: |
      ! grep -R -E "from ['\"]react|document\\.|window\\.|HTMLElement" packages/workout-spa-editor/src/store/focus-rules/
  - name: No positional-ID generators
    run: |
      ! grep -R -E "parseStepId|reconstructStepId|step-id-parser" packages/workout-spa-editor/src
  - name: No Zustand persist over UIWorkout
    run: |
      ! grep -R "persist(" packages/workout-spa-editor/src/store | grep -v ".test."
  - name: Narrow selector discipline
    run: |
      node scripts/check-pending-focus-selectors.mjs
  - name: Production bundle has no globalThis observer handle
    run: |
      pnpm -F @kaiord/workout-spa-editor build
      ! grep -R "__kaiord_overlayObserver__" packages/workout-spa-editor/dist
  ```
  Add `scripts/check-pending-focus-selectors.mjs` implementing the narrow-selector heuristic from task 10.3.a (wide `useWorkoutStore()` without an `// allow-wide-selector:` codeword on the preceding line fails)
- [ ] 11.10 Write a negative-fixture test in `scripts/__fixtures__/` containing a wide subscription without the codeword; CI job 11.9 MUST fail on it. Remove the fixture after confirming CI catches it, OR keep it behind an `--allow-fixture` flag so the check continues to be self-testing

## 12. Changeset and release

- [ ] 12.1 Add a changeset (`pnpm exec changeset`) describing focus management improvements in `@kaiord/workout-spa-editor`
- [ ] 12.2 Run `/opsx-verify spa-editor-focus-management` and resolve any mismatches against the spec scenarios
- [ ] 12.3 Run `/opsx-verify spa-editor-context-menu` and confirm no regressions
- [ ] 12.4 After PR merge, run `/opsx-archive spa-editor-focus-management` to move the change to the archive
