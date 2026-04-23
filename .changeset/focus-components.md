---
"@kaiord/workout-spa-editor": patch
---

Focus management: wire `FocusRegistryProvider` + `useFocusAfterAction`
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
