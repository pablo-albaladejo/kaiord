## Context

The workout step list in `@kaiord/workout-spa-editor` is a keyboard- and screen-reader-accessible editor where users delete, paste, add, duplicate, reorder, and undo steps and repetition blocks. After every mutation, focus behavior is inconsistent:

- Step IDs are positional (`step-${stepIndex}`, `block-${blockIndex}-step-${stepIndex}`). See `packages/workout-spa-editor/src/utils/step-id-parser.ts` and `src/components/organisms/WorkoutList/use-workout-list-dnd.ts`. When a step is deleted, the IDs of later steps shift, so references to "the deleted step" or "the step after it" become ambiguous the moment the mutation runs.
- No store field tracks which item should receive focus after a mutation. Actions (`deleteStep`, `pasteStep`, `duplicateStep`, `createStep`, `undoDelete`, reorder) update `currentWorkout` but do not record a focus intent.
- Focus is never programmatically moved. When the DOM node that had focus is unmounted (e.g., after delete), focus falls back to `document.body`, which is disorienting for keyboard and screen-reader users.

Several input methods converge on the same mutations: keyboard shortcuts (`src/hooks/useKeyboardShortcuts.ts`, `keyboard-shortcut-handlers.ts`), context menu (`src/hooks/use-editor-context-menu.ts`), toolbar buttons, and drag-and-drop. Solving focus per-input-method would duplicate logic and create inconsistencies. The right abstraction is an intent recorded by the mutation action and a DOM-layer consumer that applies it after React commits.

This change is scoped to a single package (`@kaiord/workout-spa-editor`), which sits above the hexagonal boundary (it is a UI adapter). Domain and application code in `@kaiord/core` are unaffected.

**Constraints:**
- Existing selection state uses string IDs (`selectedStepId: string | null`, `selectedStepIds: Array<string>`). The focus target system MUST continue to reference items via IDs that match selection IDs, so focus and selection stay consistent.
- `WorkoutStepWithId` and `RepetitionBlockWithId` already carry an `id` field (`src/types/krd-ui.ts`), but current code generates those IDs from positions at render time. Stable IDs need to be *persisted* on the in-memory items so they survive reorders and undo/redo snapshots.
- The store is Zustand-based with an undo/redo history (`workoutHistory`, `historyIndex`, currently typed `Array<KRD>`). This design renames the in-memory shape to `UIWorkout` to disambiguate from the portable `KRD`.
- React 18 concurrent mode, Strict Mode double-invocation, and Radix focus-trap components (ContextMenu, Dialog) are in scope for correctness.
- Dexie is used for persisted workouts/templates (see `@kaiord/workout-spa-editor` CLAUDE section "State Management"). Stable IDs are an in-memory/UI concern and are regenerated on every load.
- Project rules (CLAUDE.md): ≤100 lines per file, <40 LOC per function, TDD (test-first), zero warnings, `type` over `interface`, factory functions.
- Testing: Vitest + React Testing Library + jsdom. jsdom ≥20 is required for `crypto.randomUUID` — verified in task 1.0.
- **Internal layering note:** Within `@kaiord/workout-spa-editor`, all code is "Infrastructure" from the monorepo hexagonal perspective. Internal sub-layers (`store/` state management, `hooks/` React adapters, `contexts/` React adapters, `utils/` pure helpers, `components/` React components) are conventional, not hexagonal. Decisions below label their impact as "Infrastructure" with a parenthetical naming the sub-layer when useful.

## Goals / Non-Goals

**Goals:**
- Programmatic focus after every step-list mutation, for all input methods (keyboard, context menu, toolbar, drag-and-drop).
- Stable per-step IDs that survive reordering, delete+undo, duplicate, paste, and multi-select delete so that focus targets remain valid once React re-renders.
- A single source of truth for "what should receive focus next" (`pendingFocusTarget` in the workout store).
- A single shared consumer (`useFocusAfterAction`) that applies the pending focus to the DOM and clears it.
- Screen-reader announcements continue via existing toast `role="status"` pattern — no duplicate announcements; focus moves timed so announcements are not truncated.
- Correct behavior in React 18 concurrent mode and Strict Mode.
- Focus rules per action:
  - **Delete (single)** → next sibling; if deleted item was last, previous sibling; if parent list becomes empty, the main-list empty-state button (if main list) or the block card (if the parent block still has siblings).
  - **Delete (multi-select)** → first remaining item after the last deleted item's original position; if none, previous-sibling rule applied to the first deleted position; if list empty, empty-state.
  - **Paste / Add / Duplicate** → the newly created item.
  - **Group (createRepetitionBlock)** → the newly created block card.
  - **Ungroup** → the first formerly-child step at its new top-level position.
  - **Edit (e.g., editRepetitionBlock)** → no change to `pendingFocusTarget`.
  - **Undo of delete** → the restored item at its original position.
  - **Undo of add/paste/duplicate** → the item recorded in `selectionHistory` at that index, if still present; otherwise the item now at the mutated index; otherwise the empty-state.
  - **Reorder (Alt+Arrow or DnD)** → the moved item.

**Non-Goals:**
- Changing the KRD domain schema (`@kaiord/core`). Stable IDs live on `WorkoutStepWithId`/`RepetitionBlockWithId` in-memory, not on serialized KRD.
- Changing context-menu open/close focus behavior provided by Radix. Radix's focus return already works; only the *target* changes when the dismissing action mutated the list.
- Implementing roving-tabindex or arrow-key list navigation for idle traversal. This change only handles focus *after* a mutation.
- Persisting stable IDs to disk or round-tripping them through KRD export/import. IDs are regenerated on every load (including Dexie reload).
- List virtualization. The list is assumed to render every item into the DOM.
- Changing `@dnd-kit` configuration beyond routing `activeId` through stable IDs.
- ARIA role audit of existing step/block cards.
- Adding new toast announcements for reorder, undo, or redo (existing behavior retained; announcement enhancements are a separate change).
- Performance benchmarking. "Zero new warnings" is the only gate.
- Multi-step cut (single-step only, per existing `spa-editor-context-menu` spec).

## Decisions

### Decision 1: Stable IDs generated via an injected `IdProvider` service-locator seam

**Terminology note:** Within this SPA adapter we call `IdProvider` a "service-locator seam" or "provider" — not a hexagonal port. A true hexagonal port crosses the domain/infrastructure boundary, and the SPA has no domain of its own (it consumes `@kaiord/core`'s domain). `IdProvider` is an injectable seam for testability, located at `src/store/providers/id-provider.ts`. "Port" terminology is reserved for cross-package interfaces.

**Choice:** Define the provider type in `src/store/providers/id-provider.ts`:

```ts
export type IdProvider = () => ItemId;

// crypto.randomUUID requires a secure context. Fall back to a v4 UUID composed
// from crypto.getRandomValues so the SPA boots over HTTP (LAN/Tailscale dev).
// Never fall through to Math.random — collision resistance is required for
// history snapshot integrity.
export const defaultIdProvider: IdProvider = () => {
  if (typeof crypto?.randomUUID === "function") return asItemId(crypto.randomUUID());
  if (typeof crypto?.getRandomValues === "function") return asItemId(uuidV4FromCrypto());
  throw new Error("No secure random source available");
};
```

Store actions that introduce new items (load, create, paste, duplicate, undo-restore) accept an `IdProvider` either via closure (default) or via store construction (test override). Tests inject a deterministic sequence provider. IDs are carried on `WorkoutStepWithId` / `RepetitionBlockWithId` in-memory. IDs are stripped from the KRD payload before any `@kaiord/core` conversion port is invoked and regenerated on every load.

A branded type is introduced to keep type safety during the staged migration:

```ts
export type ItemId = string & { readonly __brand: 'ItemId' };
export const asItemId = (s: string): ItemId => s as ItemId;
```

**Rationale:**
- Positional IDs conflate identity with position; any reorder/delete/undo invalidates references.
- UUIDs are opaque, collision-free, available in all supported browsers and jsdom ≥20.
- Injection via a provider makes store actions deterministically testable without mocking `crypto`.
- Branded type prevents mixing positional IDs and stable IDs in intermediate migration states — catches errors at `pnpm lint` / `pnpm -r build` time and preserves the zero-warning invariant.

**Alternatives considered:**
- *Monotonic integer counter in store*: counter must itself be snapshotted in undo history to avoid collisions. More moving parts than UUIDs for no user-visible benefit. Rejected.
- *Content-hash ID*: identical steps (common in warm-ups) would collide. Rejected.
- *Positional IDs + `{ blockIndex, stepIndex }` coordinates*: every action would need to reason about "what index will this be *after* the mutation", which is exactly the coupling we are removing. Rejected.
- *Call `crypto.randomUUID()` directly in actions (no port)*: harder to test deterministically; forces `vi.mock('crypto')` which is fragile under Vitest. Rejected.

**Layer impact:** Infrastructure only (`@kaiord/workout-spa-editor`). No changes to domain types in `@kaiord/core`.

**Paste-path trust boundary:** `pasteStep` reads from the clipboard store, which is same-origin reachable by other tabs, rogue extensions, and devtools. Before writing clipboard content to `currentWorkout` or setting `pendingFocusTarget`, `pasteStep` MUST: (1) parse the payload through the existing `workoutStepSchema` / `repetitionBlockSchema` Zod validators and reject malformed payloads with an error toast; (2) regenerate every `ItemId` in the payload via the configured `IdProvider` (same rule as `loadWorkout`). `pendingFocusTarget` is then set to the freshly-generated id, never a clipboard-supplied id. This closes an otherwise-trivial focus-redirect path (a crafted payload with an id colliding with an already-registered step could redirect focus to an attacker-chosen DOM node).

### Decision 2: Focus intent lives in a dedicated slice of the workout store

**Choice:** Add a focus slice `FocusSlice` with `pendingFocusTarget: FocusTarget | null`, `selectionHistory: Array<string | null>`, `setPendingFocusTarget(target)`, and `recordSelectionSnapshot(selection)`. The slice is composed into `WorkoutStore` via slice-pattern to keep individual type files ≤100 lines.

`FocusTarget` is `{ kind: 'item'; id: ItemId } | { kind: 'empty-state' }`.

`selectionHistory: Array<ItemId | null>` is kept parallel to `workoutHistory`: each time a mutation pushes a new `UIWorkout` snapshot, the pre-mutation `selectedStepId` (typed as `ItemId | null`) is pushed as well. Used by undo of add/paste/duplicate to restore focus to the item that was selected immediately before the undone mutation.

Every built-in store action that mutates the step list SHALL set `pendingFocusTarget` as part of the same state update, using the rules enumerated in Goals.

**Rationale:**
- Colocates focus decisions with the action that mutated the list.
- Slice pattern keeps each types file ≤100 lines (CLAUDE.md constraint).
- `selectionHistory` removes the silent dependency called out in review: undo rules were referencing "the previously selected item" without the store actually tracking it.
- The DOM layer stays dumb: a hook reads the intent and applies it.

**Alternatives considered:**
- *Event emitter pattern*: store emits `"delete"` events, a subscriber computes focus from event + current state. Two-step reasoning; easy to miss edge cases. Rejected.
- *Return focus target from mutation methods*: couples every caller to focus handling; a new caller can forget. Rejected.
- *Separate `useFocusStore`*: focus decisions are computed from mutations — keeping them in the same store avoids cross-store coordination and `subscribe` hand-offs. Rejected.

**History interaction:** `pendingFocusTarget` itself is not snapshotted. `workoutHistory` stores `UIWorkout` snapshots (renamed from `KRD` to disambiguate from the portable format), so stable IDs in the restored snapshot are exactly the strings captured earlier. Undo/redo actions compute the target at dispatch time from the restored snapshot and `selectionHistory`.

**Layer impact:** Infrastructure. Lives in `src/store/`.

### Decision 3: `useFocusAfterAction` hook uses `useLayoutEffect` with a `prevTarget` guard

**Choice:** The hook reads `pendingFocusTarget` via a Zustand selector and runs a `useLayoutEffect` that:

1. Guards with a `useRef` holding the previously applied target — the effect body is a no-op unless the current target differs.
2. Short-circuits if `document.activeElement` is a form field (`input`, `textarea`, `select`, `[contenteditable="true"]`) inside the editor — the pending target is cleared without moving focus to avoid interrupting the user's typing.
3. Short-circuits if a Radix `Dialog` or `ContextMenu` is open, detected by an overlay-count ref maintained through a `MutationObserver` **scoped to the editor root element** (not `document.body`), watching for `data-state` attribute changes on descendants whose callback additionally filters to `target.matches('[role="dialog"],[role="menu"]')` plus a `data-radix-*` attribute — combined with Radix's `onOpenChange` callbacks where available. Scoping to the editor root prevents (a) a rogue extension injecting `<div role="dialog" data-state="open">` elsewhere in the page from silently disabling focus management, and (b) tooltip/toast hover churn on unrelated Radix primitives from firing the callback. The observer is a ref-counted singleton: lazily created on the first `subscribe()` call, `disconnect()`ed when the last subscriber unsubscribes. If `typeof MutationObserver === "undefined"` (legacy test environment), the observer assumes zero open overlays and emits a one-time dev warning. The singleton reference lives in a module-scoped `let` in production; under `NODE_ENV === "test"` it is additionally pinned to `globalThis.__kaiord_overlayObserver__` so Vitest module-reset cycles share a single reference and the test-only `__resetOverlayObserverForTests()` helper can reset it. The `globalThis` handle is NOT present in production bundles (verified by `vite build` output grep in CI). The target is *retained* until the observer reports zero open overlays; at that point the observer triggers a store action that re-reads `pendingFocusTarget` and re-fires the effect within the next animation frame.
4. Resolves the target via a ref registry (`FocusRegistryContext`) that maps `ItemId -> HTMLElement`.
5. Calls `element.focus({ preventScroll: true })` followed by `element.scrollIntoView({ block: 'nearest', behavior: shouldReduceMotion() ? 'instant' : 'auto' })`, where `shouldReduceMotion()` honours `window.matchMedia('(prefers-reduced-motion: reduce)')`.
6. Schedules the focus + scroll calls so any polite `role="status"` announcement triggered in the same commit (e.g., "Step deleted" toast) enters the AT speech queue before the focus change arrives. The concrete mechanism is `setTimeout(fn, 0)` — chosen because it yields a macrotask boundary after current microtasks drain, which empirically lets browser-to-AT aria-live plumbing flush. The spec itself states only the behavioral guarantee ("announcement queued first"); `setTimeout(0)` is an implementation choice documented here so future refactors (e.g., `queueMicrotask`, `requestAnimationFrame`) that preserve the ordering invariant are free to replace it. Unit tests assert ordering via fake timers.
7. Clears `pendingFocusTarget` in a `try { focus(); scrollIntoView(); } finally { setPendingFocusTarget(null); prevTarget.current = current }` block. The clear MUST run even if `focus()` or `scrollIntoView()` throws (e.g., element detached mid-effect, disabled between resolve and focus, `scrollIntoView` unsupported). Without the `finally`, a throw leaves a stale target that the next render retries and re-throws — a retry-storm that would peg the main thread. `scrollIntoView` is additionally wrapped in its own try/catch to swallow `TypeError` from legacy browsers missing the options-object form.
8. On unresolved targets (`resolveItem(id)` returns null — e.g., target unmounted), falls back to the main-list empty-state button if present; else the first remaining item; else the editor's labelled heading (`<h2 tabIndex={-1}>`). **Never** focuses a bare `role="list"` container (per ARIA APG — lists are not interactive).

Mutations dispatched from React event handlers are wrapped in `flushSync` at the call site when an awaited continuation must observe the committed store state (e.g., `flushSync(() => store.pasteStep(...)); // continuation reads pendingFocusTarget`). For same-tick synchronous mutations within a single event handler, React batching is relied on. The exact `flushSync` boundaries are documented in `src/store/README.md` with examples.

The hook subscribes to Zustand via a narrow selector: `const target = useWorkoutStore(s => s.pendingFocusTarget)` with reference equality. This guarantees the hook's layout effect only re-executes when `pendingFocusTarget` itself changes — unrelated store mutations (e.g., `selectedStepId` updates) do not re-run the effect.

The ref registry stores its map in a `useRef<Map<ItemId, HTMLElement>>` (not state, no re-render churn). The context `value` is memoized via `useMemo` with stable function identities via `useCallback`. The registry API is:

```ts
type FocusRegistry = {
  registerItem: (id: ItemId, element: HTMLElement) => void;
  unregisterItem: (id: ItemId, element: HTMLElement) => void;
  resolveItem: (id: ItemId) => HTMLElement | null;
};
```

`unregisterItem` takes both `id` AND `element` so it can identity-compare before deleting — a Strict Mode remount that registered a fresh element must not be clobbered by the first mount's cleanup: `if (map.get(id) === element) map.delete(id)`.

The `workoutHistory.push` + `selectionHistory.push` pair is centralized in a single helper `pushHistorySnapshot(uiWorkout, selection)` in `src/store/workout-store-history.ts`. Every mutating action calls this helper instead of pushing to the arrays directly. A dev-mode assertion verifies `workoutHistory.length === selectionHistory.length` after each push.

**Rationale:**
- `useLayoutEffect` runs after commit, before paint — eliminating the single-frame window where focus is on `document.body` between the old DOM being removed and the effect firing.
- `preventScroll: true` + explicit `scrollIntoView({ block: 'nearest' })` avoids the double-scroll artifact of default browser focus scrolling plus manual scroll.
- The `prevTarget` ref prevents repeated `focus()` calls on every unrelated re-render where the target is non-null but unchanged.
- The Strict Mode identity-guard on unregister is a known React pitfall; failing to handle it drops live elements from the registry.
- The dialog/input short-circuit is WCAG-required: focus must not be stolen from user-controlled widgets.

**Alternatives considered:**
- *`useEffect`*: ran after paint; visible focus glitch under concurrent rendering. Rejected.
- *`requestAnimationFrame` inside `useEffect`*: doubles the latency; provides no guarantees `useLayoutEffect` doesn't. Rejected.
- *`getElementById` lookup*: requires DOM IDs == item IDs exactly; pollutes DOM namespace. Rejected.
- *Imperative `forwardRef` to every card*: forces every caller to manage refs; registry scales better. Rejected.

**Layer impact:** Infrastructure. Lives in `src/hooks/` and `src/contexts/`.

### Decision 4: Per-action focus rules implemented as pure helpers, one per file

**Purity constraint:** Focus-rule helpers are pure with respect to `UIWorkout` only. They MUST NOT import from `react`, `react-dom`, `@testing-library/*`, or any DOM API (`document`, `window`, `HTMLElement`). A CI grep asserts this:
```bash
grep -R -E "from ['\"]react|document\\.|window\\.|HTMLElement" packages/workout-spa-editor/src/store/focus-rules/
```
MUST return zero matches. This keeps the helpers trivially unit-testable and prevents accidental DOM coupling.


**Choice:** Each rule is a pure function in `src/store/focus-rules/`, one function per file (≤100 lines, <40 LOC each):

- `focus-rules/next-after-delete.ts` → `nextAfterDelete(workout, deletedItemId, parentBlockId?)`
- `focus-rules/next-after-multi-delete.ts` → `nextAfterMultiDelete(workout, deletedIds, parentBlockId?)`
- `focus-rules/created-item.ts` → `createdItemTarget(newItemId)`
- `focus-rules/restored-after-undo.ts` → `restoredAfterUndoTarget(workout, restoredItemId)`
- `focus-rules/preserved-selection.ts` → `preservedSelectionTarget(workout, previouslySelectedId, fallbackIndex)`
- `focus-rules/index.ts` → barrel re-export

Each helper is unit-tested in isolation (no store, no DOM). Store action handlers import from the barrel and set `pendingFocusTarget` alongside their other state updates.

**Rationale:**
- Pure functions are trivial to unit-test.
- File-per-function respects CLAUDE.md's 100-line and 40-LOC limits.
- Keeps action handlers readable: the focus rule is one call, not inlined branching.

**Layer impact:** Infrastructure (pure UI state logic, no React, no DOM).

### Decision 5: Context-menu focus behavior splits into "mutating" vs "non-mutating" paths

**Choice:** The existing `spa-editor-context-menu` spec's single "Focus return after context menu dismissal" scenario is split into two:

- **Non-mutating dismissal** (Escape, click outside, Copy, Select All) → Radix default focus return.
- **Mutating action** (Cut, Paste, Delete, Group, Ungroup) → target dictated by `pendingFocusTarget`.

The "> **Future enhancement**" note at the bottom of the existing spec is removed as part of the MODIFIED delta — the future has arrived.

**Rationale:** Context-menu mutations go through the same store actions as keyboard mutations. Once those actions set `pendingFocusTarget`, the focus hook fires regardless of how the action was triggered.

**Layer impact:** Documentation only.

### Decision 6: In-memory state type renamed `UIWorkout`; Dexie reload regenerates IDs

**Choice:** The in-memory store shape (`currentWorkout`, `workoutHistory`) is typed as `UIWorkout` — structurally `KRD` plus `id: ItemId` on every step and block. KRD is the portable/serialized shape; `UIWorkout` is the in-memory shape. Exporters strip `id` fields via a single `stripIds(uiWorkout): KRD` helper before passing to `@kaiord/core` conversion ports OR to Dexie persistence. Dexie reads the portable `KRD` shape (unchanged); on reload, a fresh `UIWorkout` is materialized with new IDs. Every Dexie write path MUST call `stripIds` before persisting — task 3.2 covers this.

`UIWorkout`, `WorkoutStepWithId`, and `RepetitionBlockWithId` are canonicalized in a single file `src/types/krd-ui.ts` (the existing file). `src/store/workout-state.types.ts` re-exports them for backwards compatibility with any existing imports.

`stripIds(uiWorkout): KRD` lives in `src/store/strip-ids.ts` — colocated with the store (not `src/persistence/` or `src/adapters/`) because it acts on the in-memory `UIWorkout` shape. It is the outbound-boundary adapter that converts the UI shape to the portable `KRD` shape. Every outbound code path (Dexie write, `@kaiord/core` conversion port call) invokes it as the single chokepoint.

**No Zustand `persist` middleware over `UIWorkout`:** No Zustand slice MAY use `persist` middleware against any state shape that contains `UIWorkout` (today, consistent with the project's "Zustand never auto-persisted" rule). If future persistence is added it MUST pass through `stripIds` as an explicit `partialize` transform. A CI grep (`grep -R "persist(" src/store/`) MUST return no matches against workout-store slices that import `UIWorkout`.

The hook subscribes to Zustand via `useWorkoutStore((s) => s.pendingFocusTarget)` with the default `Object.is` equality. Each `setPendingFocusTarget({ kind: 'item', id })` creates a new object reference, so the selector reports inequality and the hook re-runs the layout effect even when the logical target is unchanged. The `prevTarget` ref guard inside the hook makes the extra fire a no-op (no `focus()` call), so the correctness cost is zero and the performance cost is a single reference comparison per mutation. A shallow-equality wrapper would avoid the re-run entirely but at the cost of an import + allocation; the simpler `Object.is` + prevTarget pattern is preferred.

**Consumer-selector discipline:** Any consumer of `pendingFocusTarget` other than `useFocusAfterAction` MUST subscribe with an equally narrow selector. A wide subscription (e.g., `useWorkoutStore()` or `useWorkoutStore(s => s)`) would re-render on every mutation because a new `pendingFocusTarget` object is produced by every mutating action. `src/store/README.md` documents this constraint; a CI grep asserts no component or test imports `pendingFocusTarget` via a non-narrow selector.

**Atomic migration note:** Renaming `currentWorkout: KRD` → `currentWorkout: UIWorkout` in `WorkoutStore` is a type-breaking change across every action creator that constructs a workout. To preserve the zero-warning invariant at every commit, task group §2 is executed as a single atomic PR (tasks 2.0.a through 2.2.b merge together). A transitional union type (`KRD | UIWorkout`) is not used — TypeScript narrowing at hundreds of call sites would be more disruptive than an atomic migration.

**Rationale:**
- Review flagged a tension: the design said history stored `KRD`, but stable IDs had to be on items in history snapshots. Renaming resolves the tension without forcing IDs into serialized/persisted forms.
- Regenerating IDs on Dexie reload is acceptable because `pendingFocusTarget` never spans a reload — after reload, no focus target should carry over from a prior session.

**Alternatives considered:**
- *Persist IDs in Dexie schema*: forces a Dexie migration and makes the ID contract durable across sessions. No user-visible benefit; rejected.
- *Keep history as `Array<KRD>` and re-attach IDs on every undo*: loses the IDs the user just saw; breaks undo-focus scenarios. Rejected.

**Layer impact:** Infrastructure. Affects `src/store/workout-state.types.ts`, `src/store/workout-store-history.ts`, and exporters.

## Risks / Trade-offs

- **[Risk] Stable-ID migration touches every file that generates or parses IDs** → Mitigation: stage work across tasks §1 (generator + store assignment), §4 (action wiring), §7 (consumer migration), §8 (deletion of positional generator). The branded `ItemId` type prevents mixing in intermediate states and keeps TypeScript + ESLint happy at every commit. Each stage is independently mergeable.
- **[Risk] Undo/redo restores a step but the focus target uses an ID that existed in a different history state** → Mitigation: `workoutHistory` stores `UIWorkout` snapshots with IDs baked in; `selectionHistory` mirrors it. Undo/redo reads IDs from the restored snapshot, not pre-undo state. Tests cover delete → undo → redo, add → undo, paste → undo.
- **[Risk] React 18 concurrent mode drops passive effects when a higher-priority render preempts** → Mitigation: `useLayoutEffect` (synchronous with commit) cannot be dropped. `flushSync` used around awaited mutations where a commit must precede a continuation.
- **[Risk] React Strict Mode double-mounts components, corrupting the ref registry** → Mitigation: registry uses idempotent register + identity-checked unregister (`if (map.get(id) === el) map.delete(id)`). Unit tested explicitly.
- **[Risk] Focus steal interrupts user typing in an inline editor** → Mitigation: hook short-circuits when `document.activeElement` is an input/textarea/select/contentEditable inside the editor. Scenario covered in spec.
- **[Risk] Focus move during a Radix dialog/menu open breaks the focus trap** → Mitigation: hook detects `[role="dialog"][data-state="open"]` and `[role="menu"][data-state="open"]` and defers until close. Re-fires via an additional effect keyed on overlay state.
- **[Risk] Polite toast announcement (`role="status"`) interrupted when focus moves** → Mitigation: the hook delays focus via a one-tick `setTimeout(fn, 0)` so the polite live-region update enters the AT speech queue before the focus change. This guarantees event-loop ordering but is only a heuristic at the AT layer — VoiceOver on macOS coalesces polite updates in a ~250 ms window, and a focus change mid-window has been observed to truncate speech in some versions. Task 11.6 requires naming an evidence artifact (transcript file path or Accessibility Inspector screenshot) in the PR description. If truncation is observed, the fallback is to duplicate the toast message into the focus target's `aria-describedby` transient so the AT re-announces it on focus arrival. That fallback is covered by Open Question 1.
- **[Risk] Programmatic focus in Safari may not trigger `:focus-visible`** → Mitigation: step/block card styles use both `:focus` and `:focus-visible` with identical outlines; explicit E2E check in task 9.4 across Chrome/Firefox/Safari.
- **[Risk] Rapid sequential mutations cause focus thrash** → Mitigation: because the hook is idempotent on `prevTarget` and `pendingFocusTarget` is a scalar (last-write-wins), only the final target of a React batch applies. Scenario covered in spec.
- **[Risk] Render loop if something sets `pendingFocusTarget` again in response to the clear** → Mitigation: per Decision 3, the hook attempts `focus()` + `scrollIntoView()` inside a `try` block and clears `pendingFocusTarget` in the `finally` block (so the clear runs unconditionally, even if focus throws). The clear is a single `setPendingFocusTarget(null)` call; any downstream observer that reacts by re-setting a non-null target produces a fresh render cycle whose `prevTarget` guard prevents re-application of the just-cleared value. No synchronous render loop is possible because `finally` runs after the React-event-driven effect body completes. Scenario covered in spec.
- **[Risk] `crypto.randomUUID` not available in older jsdom** → Mitigation: task 1.0 verifies jsdom ≥20; polyfill via `IdProvider` default if not.
- **[Trade-off] Extra store state + extra layout effect per render** → Acceptable: `pendingFocusTarget` is null 99% of the time; the `prevTarget` ref short-circuits unchanged targets. No measurable cost.
- **[Trade-off] Stable IDs regenerated on every load** → Acceptable: focus targets are session-scoped; no user-visible impact across reloads.
- **[Trade-off] `pendingFocusTarget` in same store as `currentWorkout`** → Acceptable: simpler than a separate store; no cross-store coordination.

## Migration Plan

1. **Introduce branded `ItemId` and `IdProvider` port** (task 1.0). Zero behavioral change; preserves zero-warning invariant for later steps.
2. **Add stable IDs to store state** (task 1.2 onwards) — `loadWorkout`, `createStep`, etc., assign `id: idProvider()`. Positional-ID generators stay in place as render-time fallbacks.
3. **Add `pendingFocusTarget` + `selectionHistory` + setters** (task §2). No consumers yet; unit-test round-trip.
4. **Add focus-rule helpers** (task §3). No consumers yet; unit-test each.
5. **Wire focus rules into actions** (task §4). One action at a time, each with a test. Store-only; no DOM yet.
6. **Add `useFocusAfterAction` + `FocusRegistryContext`** (task §5). Wire into `WorkoutList`, `StepCard`, `RepetitionBlockCard` (task §6). Validate manually.
7. **Switch consumers to stable IDs** (task §7). DnD, context menu, keyboard handlers. Re-verify `spa-editor-context-menu` spec scenarios.
8. **Delete positional-ID generator and `step-id-parser.ts`** (task §7.5) once no consumers remain.
9. **Apply spec deltas** (task §8). Move to `openspec/specs/`.

**Rollback strategy:** Each phase is a standalone PR. If a regression appears after phase 7 or 8, revert to phase 6 (positional generators still present as shim). No data-migration concerns — stable IDs are never persisted.

## Open Questions

- **VoiceOver truncation contingency:** Task 11.6 gathers AT evidence with the `setTimeout(0)` mechanism. If VoiceOver or NVDA truncates the toast on some versions, the contingency is to duplicate the toast message into the focus target's `aria-describedby` for one render tick so the AT re-announces it on focus arrival. This is deferred to a follow-up change (tentative id `spa-editor-focus-at-describedby-fallback`) rather than pre-emptively adding scope here. If the evidence shows the contingency is needed, the PR is held and the follow-up is proposed *before* merging this change.
- **Radix focus-scope return override:** Is Radix's `FocusScope` automatic focus-return to the trigger element correctly overridden by our programmatic focus, or does Radix reclaim focus on menu close after our call? Validate empirically in task 11.5 via context-menu Delete/Paste/Group scenarios. If Radix reclaims, wrap the hook's `focus()` in a `queueMicrotask` after Radix's `onOpenChange(false)` callback fires.
