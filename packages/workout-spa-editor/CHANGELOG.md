# @kaiord/workout-spa-editor

## 0.2.0

### Minor Changes

- b126d94: Replace build-time `VITE_*_EXTENSION_ID` env vars with runtime bridge
  discovery via content script announcements.

  **Why**: the old flow baked extension IDs into the SPA bundle at build
  time, which coupled each build to a specific install and required new
  developers to edit `.env.local` before extensions could be detected
  (Twelve-Factor III / V violation). The new flow is zero-config for
  users and developers — install the extension and it announces itself
  to the SPA on every navigation.

  **`@kaiord/garmin-bridge` & `@kaiord/train2go-bridge` (minor — user-visible
  discovery change requiring extension reload):**
  - New `kaiord-announce.js` content script injected at
    `document_start` on `https://*.kaiord.com/*` (and
    `http://localhost/*` in dev) posts `KAIORD_BRIDGE_ANNOUNCE` with
    `chrome.runtime.id`, version, and declared capabilities
  - Listens for `KAIORD_BRIDGE_DISCOVER` from the SPA and re-announces
    to handle the service-worker cold-start race
  - Manifest (`manifest.json` + `manifest.prod.json`) adds a second
    `content_scripts` entry for the announce-only script. Existing
    host-scoped scripts (`connect.garmin.com` / `app.train2go.com`)
    are unchanged

  **`@kaiord/workout-spa-editor` (minor — runtime discovery replaces env-var
  coupling):**
  - New `bridge-discovery` adapter listens for announcements on
    `window.message`, verifies each via a ping against the announced
    `extensionId` (manifest schema + `data.id` match + supported
    protocol version), and exposes `getExtensionId(bridgeId)` to the
    rest of the app. Rejects spoofed announcements
  - `useGarminBridgeActions` and the `train2go-store` actions no longer
    read `import.meta.env.VITE_*_EXTENSION_ID`; they call the
    discovery singleton at call time, so the ID updates reactively
    on announcement
  - `useStoreHydration` starts the discovery listener on app boot
  - `VITE_GARMIN_EXTENSION_ID` and `VITE_TRAIN2GO_EXTENSION_ID` are
    removed from `.env.example` — no extension ID env vars required
  - Privacy policy discloses the new announce-only content script
    (and its localhost-dev variant stripped from the production
    manifest); the `check-privacy-policy` lint now allows the
    announce match set and flags missing disclosure

  **Migration note**: users must reload/update both Chrome extensions
  after this release so the new `kaiord-announce.js` content script is
  picked up. After the reload, the SPA auto-detects the extension with
  no additional configuration.

- a2888cf: Close eight spec-vs-code drift gaps identified by the 2026-04-20
  `/opsx-sync` audit. No public API breaks; the SPA changes are
  internal to `@kaiord/workout-spa-editor` and ship behind a Dexie
  v2+v3 schema bump with additive, backwards-compatible migrations.

  **`@kaiord/workout-spa-editor` (minor — new UI affordances, new
  Dexie stores, additive schema):**
  - Surface a storage-unavailable banner when `probeStorage()` reports
    failure ("Storage unavailable — changes in this session won't be
    saved"). Wired through a new `storage-store` + single-mount
    invariant in `MainLayout`.
  - Introduce `BridgeStatus = "verified" | "unavailable" | "removed"`.
    Pruning now transitions `unavailable → removed` after 24h (with a
    user notification) and deletes the row 24h after that. Registry
    persists to a new `bridges` Dexie store so the lifecycle timers
    survive browser restarts.
  - Pin the Train2Go 30s detection cache behavior (never-detected,
    cached-and-stale, cached-not-installed, no-rolling-window).
  - Advance `modifiedAt` on every KRD edit via a new
    `onWorkoutMutation` helper wired into the editor save path — edits
    in STRUCTURED/READY now bump the timestamp, not only the legacy
    PUSHED→MODIFIED transition.
  - Enrich `BatchProgress` with `counts` and per-workout `byId` so the
    calendar batch-progress panel can render per-workout status.
  - Split `UsageRecord.totalTokens` into `inputTokens` / `outputTokens`
    (derived `totalTokens` retained for legacy readers, Zod `.refine`
    pins the invariant). Dexie v3 migration backfills legacy rows
    (`inputTokens = totalTokens`, `outputTokens = 0`, `legacy: true`);
    the usage-panel renderer shows `—` for `outputTokens` on legacy
    rows.

  **`@kaiord/docs` (patch — head meta tag + token-parsing helper):**
  - Add `<meta name="theme-color">` to the VitePress docs head. Value
    is parsed at config-load time from `--brand-bg-primary` in
    `styles/brand-tokens.css`; CI invariant blocks re-introducing a
    hex literal under `packages/docs/`.

  **Repo-level** (not a publishable-package bump, called out here for
  the release log):
  - `.changeset/config.json` adds `@kaiord/garmin-bridge` and
    `@kaiord/train2go-bridge` to `linked[0]` so bridge extensions
    version in lockstep; guarded by `scripts/check-changeset-config.test.mjs`.

### Patch Changes

- 2e3dd28: Focus management: wire `FocusRegistryProvider` + `useFocusAfterAction`
  into the editor component tree (§8.1–§8.5 of the
  `spa-editor-focus-management` proposal). After this PR every workout
  mutation that writes `pendingFocusTarget` actually moves DOM focus.
  - `WorkoutSection` wraps `FocusRegistryProvider` around the editor
    subtree and mounts `useFocusAfterAction` via a thin
    `useWorkoutSectionFocus` hook. Three fallback refs are wired in:
    the editor root (`<div data-testid="editor-root">`), the Add Step
    button (§7.5 empty-state target), and the workout title `<h2>`
    (§7.5 last-resort heading).
  - `WorkoutTitle` adds `tabIndex={-1}` to the `<h2>` and forwards a
    new `titleRef` prop, with a `:focus-visible` outline so the
    programmatic focus is visible.
  - `WorkoutStepsList` accepts `editorRootRef` and
    `addStepButtonRef`, attaching them to the outer `<div>` and the
    "Add Step" button. The outer `<div>` now carries
    `data-testid="editor-root"` for tests.
  - `WorkoutStepsListActions` forwards `addStepButtonRef` to the
    `<Button>` (which already supported ref forwarding).
  - `StepCard` and `RepetitionBlockCard` self-register with the
    registry under their own `step.id` / `block.id` via a shared
    `useFocusRegistration` hook. A `mergeRefs` utility combines the
    forwarded `ref` (DnD, tests) with the internal registration ref.

  Integration tests in
  `WorkoutSection.focus-integration.test.tsx` drive real store
  mutations through the full render tree and assert
  `document.activeElement` after each `setTimeout(0)`:
  - next sibling after `deleteStep(0)` on two-step workout
  - focus on new step card after `createStep()`
  - Add Step button focused when the list becomes empty
  - focus does NOT move while an `<input>` inside the editor root is
    focused (form-field guard from §7.3)

- eb0dff3: Focus management: DOM bridge for the `pendingFocusTarget` intent (§7 of
  the `spa-editor-focus-management` proposal). The store has been writing
  focus intents since PR #339; this PR adds the runtime that actually
  moves the caret.

  **§7.1 FocusRegistryContext.** A React context that maps stable
  `ItemId`s to mounted DOM elements. `registerItem` is idempotent,
  `unregisterItem` only deletes when the stored element matches the
  caller's (StrictMode double-mount guard), and the context `value`
  reference is stable across re-renders that do not touch the registry.

  **§7.4 overlay observer.** A ref-counted `MutationObserver` singleton
  (`subscribeToOverlayCount`) scoped to the editor root element — not
  `document.body` — so that a foreign `<div role="dialog">` injected
  elsewhere cannot defer focus indefinitely (availability-DoS
  mitigation). Only elements with `role="dialog" | "menu"`,
  `data-state="open"`, and at least one `data-radix-*` attribute are
  counted. When `MutationObserver` is unavailable the observer assumes
  zero overlays, emits a single dev-mode warning, and hands back a
  no-op unsubscribe. A test-only `__resetOverlayObserverForTests()`
  disposes every observer and clears the `globalThis.__kaiord_overlayObserver__`
  mirror that Vitest uses to keep the singleton alive across module
  resets.

  **§7.5 fallback chain.** `resolveFocusElement` resolves a
  `FocusTarget` into a real element through a strict order —
  explicit target → empty-state button → first registered item →
  labelled editor heading → `null`. Elements that are detached
  (`isConnected === false`) or carry `role="list"` are rejected so
  focus never lands on a bare container. When the chain yields
  `null`, the hook clears `pendingFocusTarget` and emits a dev-mode
  warning instead of attempting a silent no-op focus move.

  **§7.2–7.3, 7.6–7.8 `useFocusAfterAction` hook.**
  - Subscribes via a narrow selector so unrelated store keys do not
    trigger re-renders.
  - Form-field guard: when `document.activeElement` is a text input,
    textarea, select, or `contenteditable` element inside the editor
    root, the hook clears the target without moving focus.
  - Overlay defer: while the overlay observer reports `count > 0`,
    the hook stashes the target, clears `pendingFocusTarget`, and
    re-applies the stashed target one `requestAnimationFrame` after
    the count returns to zero.
  - `applyFocusToElement` performs `focus({ preventScroll: true })`
    and `scrollIntoView({ block: "nearest", behavior })` with
    `behavior = "instant"` under `prefers-reduced-motion: reduce`
    and `"auto"` otherwise. Both calls are wrapped in try/catch so
    a detached node or a legacy engine rejecting the options-object
    form cannot throw past the API boundary.
  - Focus moves are scheduled inside `setTimeout(fn, 0)` so a
    concurrent `role="status"` toast queues first in the AT speech
    pipeline.
  - A `prevTargetRef` guard collapses rapid sequential
    `setPendingFocusTarget` calls into a single focus move on the
    final value.

  **§7.9 flushSync patterns** documented in
  `src/store/README.md` with three runnable snippets covering
  paste-then-continuation, delete-then-continuation, and
  paste-inside-dialog continuation.

  Component integration (wiring `FocusRegistryProvider` and the hook
  into `WorkoutList`, `StepCard`, `RepetitionBlockCard`, and the
  empty-state button) lands in the follow-up §8.1-§8.5 PR.

- 1a876b6: Focus management: wire store actions to focus-rule helpers (§6),
  enforce single-parent multi-selection invariant (§8.8), and document
  the store in `src/store/README.md` (§10).

  **§6 — action wiring.** Every state-mutating action now writes a
  `pendingFocusTarget` alongside the new workout snapshot:
  - **Delete** (`deleteStep`, `deleteRepetitionBlock`) →
    `nextAfterDelete({ workout, deletedIndex })` — next-sibling /
    previous-sibling / empty-state.
  - **Creation** (`createStep`, `duplicateStep`,
    `createEmptyRepetitionBlock`, `addStepToRepetitionBlock`,
    `duplicateStepInRepetitionBlock`, `createRepetitionBlock`,
    `pasteStep`) → `createdItemTarget(newId)`. `pasteStep` focuses the
    freshly-regenerated id, never the clipboard-supplied one.
  - **Ungroup** → focus the first extracted child.
  - **Clear** → `null`.
  - **Undo delete** → `restoredAfterUndoTarget(workout, restoredId)`.
  - **Undo/redo** → `preservedSelectionTarget(snapshot, priorSelection,
index)`, reading the parallel `selectionHistory` slice.
  - **Reorder** (`reorderStep`, `reorderStepsInBlock`) →
    `createdItemTarget(movedId)` to keep focus on the dragged item.

  `PasteStepResult` exposes a `pastedItemId` field so the store reducer
  can set focus without re-walking the workout.

  **§8.8 — single-parent multi-selection invariant.** A selection cannot
  span the main list and the inside of a repetition block, nor span two
  different blocks. `toggleStepSelection` now _replaces_ the selection
  (rather than extending it) when a toggle would violate that invariant;
  `selectAllSteps` filters to the subset that shares the first id's
  parent. Covered by 7 new tests in `selection-invariant.test.ts`.

  **§10 — store README.** `packages/workout-spa-editor/src/store/README.md`
  documents the runtime state slices (workout / history / focus /
  clipboard / selection), the action surface, the `pushHistorySnapshot`
  and `stripIds` chokepoints, the pure focus-rule helpers, and the
  narrow-selector discipline consumers must follow to avoid coupling to
  full `WorkoutStore` shape.

  Deferred to follow-up PRs: §7 focus hook + registry + overlay
  observer, and §8.1–§8.5 component integration that depends on §7.

- 1d09501: Internal refactor: consumer migration to stable ItemIds (§9 of the
  `spa-editor-focus-management` proposal) + block-ID cleanup.
  - Introduce `findById(workout, id)` helper that locates a step / block /
    nested-step by its stable `ItemId` and returns its position context
    directly — replaces the legacy positional-ID parser.
  - Migrate consumers to the helper: `useSelectedStep`, `getSelectedStepIndex`,
    `parseSelectedStepIndex`, `workout-section-handlers-helpers`,
    `build-step-handlers` (the Ctrl+Shift+G ungroup check no longer relies on
    `selectedStepId.startsWith("block-")`), the DnD sortable ids, and the
    `WorkoutPreview` bar flattening.
  - Delete `step-id-parser.ts` + its test file (dead code after the
    migration); remove the `migrateRepetitionBlocks` pre-pass from
    `createLoadWorkoutAction` (redundant now that `hydrateUIWorkout` assigns
    every id).
  - Flip block IDs to `defaultIdProvider()` (UUID v4) — no more
    `Math.random`-based `generateBlockId()` in store mutations.
  - Flip `hydrateUIWorkout` default to `preserveExistingIds: false` per
    design decision 6 ("stable IDs are regenerated on every load"). The
    preserve mode remains available as an opt-in.
  - CI focus-invariants: grep guards that reject any future reintroduction
    of positional-ID parsers or Zustand `persist()` middleware over the
    workout store.

  No user-visible behavior change; the UIWorkout ↔ KRD contract at the
  `@kaiord/core` port boundary is unchanged because `stripIds` is still the
  outbound chokepoint.

- 7cf10c4: Internal refactor: focus-management foundations.
  - Introduce branded `ItemId` type and `IdProvider` seam (UUID v4 with
    `crypto.getRandomValues` fallback for non-secure contexts).
  - Rename in-memory shape to `UIWorkout` (alias of `KRD` augmented with
    `UIWorkoutStep`/`UIRepetitionBlock` carrying required `id: ItemId`).
    Every creation/duplicate/paste action now emits a fresh `ItemId`; history
    snapshots preserve IDs across undo/redo and undo-delete.
  - Add `stripIds` chokepoint: Dexie workout/template writes, save-to-file,
    and `exportWorkout` all strip UI ids before hitting the portable `KRD`
    surface. `pasteStep` regenerates every id to close the clipboard trust
    boundary.

  No user-visible behavior change yet; focus state, hooks, components, and
  consumer migration are intentionally out of scope for this PR.

- 5500498: Internal refactor: focus target state + selection history (§4 of the
  `spa-editor-focus-management` proposal).
  - `FocusTarget` discriminated union (`{ kind: 'item'; id: ItemId }` |
    `{ kind: 'empty-state' }`) in `src/store/focus/focus-target.types.ts`,
    with `focusItem(id)` / `focusEmptyState` constructors.
  - `FocusSlice` adds `pendingFocusTarget: FocusTarget | null` plus
    `setPendingFocusTarget(target)` to the workout store. Dumb setter: no
    DOM lookup, no resolution — the hook (§7) consumes the target.
  - `selectionHistory: Array<ItemId | null>` kept exactly parallel to
    `workoutHistory` so undo/redo fallback rules (§6) can restore focus
    to the item that was selected immediately before the undone mutation.
  - `pushHistorySnapshot(state, uiWorkout, selection)` helper in
    `src/store/workout-store-history.ts` — the ONLY production code path
    that appends to `workoutHistory`. `createUpdateWorkoutAction` now
    routes every mid-session push through it. Dev-mode length-drift
    assert + CI invariant enforce the single-call-site rule.
  - `workout-store-types.ts` split into `workout-store-state.types.ts`
    - `workout-store-actions.types.ts` to respect the repo's
      ≤80-line-per-file ESLint rule.

  No consumer wiring yet — that's §6 (focus-rule helpers into mutating
  actions) and §7 (`useFocusAfterAction` hook). This PR only lays the
  foundation.

- d26c17f: Internal refactor: pure focus-rule helpers (§5 of the
  `spa-editor-focus-management` proposal).

  Five pure functions, one per file in `src/store/focus-rules/`, each
  taking a `Workout` + mutation ids and returning a `FocusTarget`:
  - `createdItemTarget(id)` — newly-created items.
  - `nextAfterDelete({ workout, deletedIndex, parentBlockId? })` —
    next-sibling / previous-sibling / empty-state rules for single
    deletes (covers main-list and block-child branches, including the
    "block becomes empty → anchor to parent block" cascade).
  - `nextAfterMultiDelete({ workout, deletedIndices })` — multi-select
    delete (contiguous, non-contiguous, delete-all).
  - `restoredAfterUndoTarget(workout, id)` — focus restored item if still
    present, else empty-state.
  - `preservedSelectionTarget(workout, priorSelection, fallbackIndex)` —
    prior selection present / same-index fallback / empty-state.

  The rules read `Workout` state only; `findById` does the lookup. No
  React, no DOM, no store imports — a new CI focus-invariant grep in
  `.github/workflows/ci.yml` rejects any `from 'react'` / `document.` /
  `window.` / `HTMLElement` under `src/store/focus-rules/`.

  Consumers (§6 action wiring) land in a follow-up PR.

- e395800: Focus management: hardening pass — consistent `:focus-visible` outline
  on every focusable item target, reduced-motion support, and a CI-grep
  invariant that enforces narrow Zustand subscriptions
  (§8.6–§8.7 + §10.3 of the `spa-editor-focus-management` proposal).

  **§8.6–§8.7 — styling + tab-order.**
  - `StepCard`, `RepetitionBlockCard`, and the workout title `<h2>`
    render the same `focus-visible:ring-2 focus-visible:ring-blue-500
focus-visible:ring-offset-2` outline (dark variants included), so a
    programmatic focus move from `useFocusAfterAction` produces the
    same visual signal on every item type.
  - `motion-reduce:transition-none` disables the color transition on
    the cards when `prefers-reduced-motion: reduce` is set, sparing
    users with vestibular sensitivity a flash on focus.
  - Step cards keep `tabIndex={0}` so the programmatic focus target
    stays in the normal sequential Tab order.

  **§10.3 — narrow-selector CI invariant.**
  - Added a Python-based focus-invariant check in `.github/workflows/ci.yml`
    that rejects `useWorkoutStore()` (no-arg) and identity selectors
    like `useWorkoutStore((s) => s)` under
    `packages/workout-spa-editor/src/components/**` and `src/hooks/**`.
    Consumers must subscribe via narrow selectors or pre-baked hooks
    from `workout-store-selectors.ts` so a `setPendingFocusTarget`
    write does not re-render every consumer.
  - Migrated the three pre-existing wide-selector consumers
    (`useGarminPush`, `useAiGeneration`, `LayoutHeader`) to narrow
    hooks (`useCurrentWorkout`, `useLoadWorkout`). Test mocks updated
    to match the new import paths.

## 0.1.0

### Minor Changes

- 3d8b6df: Redesign Profile Manager with zone method system
  - Add zone method registry (Coggan, Friel, British Cycling, Karvonen, Daniels, Custom)
  - Replace auto/manual toggle with method dropdown per zone type
  - Show zone values in real units (watts, bpm, min/km) instead of percentages
  - Redesign Profile Manager layout: remove Edit Profile card, add Training Zones and Personal Data tabs
  - Add inline-editable profile name in dialog header
  - Support custom zone count (add/remove zones, 1-10 range)
  - Update LLM zones formatter to output real values with method names
  - Add migration from legacy `mode` field to `method` field

- bd2a385: Calendar-centric SPA redesign: week view as home page, Dexie.js persistence via PersistencePort, workout state machine (RAW->STRUCTURED->READY->PUSHED), bridge plugin protocol, AI batch processing with Spanish coaching language support, and library page refactor.
- 972fb38: Add sport-specific training zones: per-sport HR, power, and pace zone configs with auto/manual modes, tabbed zone editor in Profile Manager, AI zone indicator, sport-aware zones formatter, and profile migration from legacy format.
- 11dc56c: Add coaching platform integration with Train2Go Bridge extension support. Introduces CoachingSource port, registry pattern, and generic coaching activity cards in the calendar. Platform-agnostic architecture allows future coaching platforms (TrainingPeaks, etc.) with zero calendar code changes.

### Patch Changes

- b5b12a5: Replace hardcoded Lambda URL with VITE_GARMIN_LAMBDA_URL env var, migrate stale api.kaiord.com URL from localStorage, show Configure Garmin when URL is empty
- d29c5db: fix: context-aware keyboard shortcuts and custom context menu
  - Keyboard shortcuts (Cmd+C, Cmd+V, Cmd+X, Cmd+A, Cmd+G, Escape, Alt+Arrow) only call
    `preventDefault()` when the app action is meaningful; otherwise the browser handles the
    event natively (e.g., native text copy when no step is selected)
  - Exact modifier matching: Cmd+Shift+C, Cmd+Shift+S, etc. pass through to the browser
  - Added Cmd+X (Cut) support: copy + delete in one action
  - Custom right-click context menu on the step list with Cut, Copy, Paste, Delete,
    Select All, Group, and Ungroup actions (with keyboard shortcut hints and ARIA attributes)
  - Native context menu fallback when no app actions are applicable
  - Extended form element passthrough to include contentEditable elements
  - Added `hasClipboardContent()` to clipboard store for synchronous content checks

- 99665b0: Add AI batch cost-confirmation dialog and Settings → Usage panel.

  The batch banner's "Process all with AI" button now opens a confirmation dialog showing the configured provider, estimated tokens (chars/3 heuristic), and estimated USD cost (per-provider blended rate) before dispatching the run. The new Settings → Usage tab renders cumulative AI token usage and cost for the current month plus the previous five, read live from the Dexie `usage` table.

  Closes the remaining two findings from the 2026-04-18 opsx-sync audit (`address-opsx-sync-drift`).

- 414f399: Add Train2Go Bridge status to Settings panel and rename tab from "Garmin" to "Extensions"
  - Rename Settings "Garmin" tab to "Extensions" to reflect multiple bridge support
  - Add Train2Go Bridge Extension status section (not installed / no session / connected)
  - Update FirstVisitState and NoBridgesState copy to mention both Garmin Connect and Train2Go

## 0.0.5

### Patch Changes

- 84e1776: Improve UX discoverability and feedback:
  - Add EmptyWorkoutState component showing guidance when workout has no steps
  - Add error explanation message when save button is disabled
  - Enhance step selection visual with ring effect and checkmark indicator
  - Add tooltip to drag handle with proper touch target (44x44px)
  - Add UndoRedoButtons to workout header with keyboard shortcut hints
  - Add selection hints for creating repetition blocks

- Updated dependencies
- Updated dependencies [791d3b2]
  - @kaiord/core@1.0.3

## 0.0.4

### Patch Changes

- Updated dependencies
  - @kaiord/core@1.0.2

## 0.0.3

### Patch Changes

- Updated dependencies
  - @kaiord/core@1.0.1

## 0.0.2

### Patch Changes

- Updated dependencies
  - @kaiord/core@0.1.3

## 0.0.1

### Patch Changes

- Updated dependencies
  - @kaiord/core@0.1.2
