---
"@kaiord/workout-spa-editor": patch
---

Focus management: DOM bridge for the `pendingFocusTarget` intent (§7 of
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
