---
"@kaiord/workout-spa-editor": patch
---

Focus management: hardening pass — consistent `:focus-visible` outline
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
