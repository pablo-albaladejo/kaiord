# Rebrand V2 · editor canvas and the verb cut

## Why

The editor is the screen the whole app exists to reach, and it is the screen
that asks the most of the person standing in front of it.

**Seven verbs, one intention.** A workout in flight can show four buttons that
all end the task, none of which states its consequence:

| Verb            | What it does                                 | Where it lives                     |
| --------------- | -------------------------------------------- | ---------------------------------- |
| Accept Workout  | Marks it agreed. Sends nothing.              | `EditorWorkflowBar` · `structured` |
| Push to Garmin  | Sends it to the watch.                       | `EditorWorkflowBar` · `ready`      |
| Send to Garmin  | Also sends it to the watch. Hardcoded.       | `GarminPushButton`                 |
| Re-push         | Sends it again after an edit. Hardcoded.     | `ModifiedIndicator` · `modified`   |
| Save Workout    | Downloads a file. Nothing to do with saving. | `SaveButton`                       |
| Save to Library | Keeps it as a reusable template.             | `SaveToLibraryButton`              |
| Save            | Commits the field just typed.                | `StepEditorActions`                |

Accept and Push are two confirmations of one decision rendered on two different
states of the same bar — they are never on screen together, so you cannot tell
you are halfway. "Save Workout" downloads. "Save" asks permission to keep a
change in a local-first app that already kept it. Getting today's session onto
a watch costs six steps; changing one target and re-sending costs five.

**Five equal-weight cards.** `WorkoutSection` stacks header, stats, chart,
step-form and list as five sibling cards of identical chrome. The chart is not
connected to the list it summarises; selecting a step opens a form _above_ the
list rather than at the row; and nothing on the screen answers "why does this
interval say 241–281 W" — no surface connects a target to the FTP it derives
from, or that FTP to the profile that holds it.

**One gate renders nothing.** `GarminPushButton` has four outcomes and only
three of them are visible: `!extensionInstalled` returns `null`. The most
common reason a push cannot happen is the one the screen refuses to name.

**The repetition block is painted in brand blue.** Dashed `primary-300`
borders, a `primary-50/50` fill and `color="primary"` icons — on a screen whose
only legitimate colour is the training zones of its steps.

## What Changes

- **Seven verbs become three: Send · Keep · Download.** `Send to Garmin`
  implies accepting, so `Accept Workout` disappears together with the
  `structured → ready` button; the transition still happens, folded into the
  one send. `Re-push` disappears — the ribbon says what is stale and offers the
  same single send. `Save Workout` becomes `Download a file`, which is what it
  always did. `Save to Library` becomes `Keep in library`. The step-level
  `Save` becomes `Done`: a local-first editor has no reason to ask.
  The cut is applied everywhere the verbs appear, not only in the editor —
  `PushButton` (workout detail), `MatchedActions` (coaching), the command
  palette's save command and Create Workout's `Save & push`.

- **One push path.** `GarminPushButton` leaves the bottom action row and
  becomes the CTA of a new `EditorStateRibbon`. There is exactly one control
  on the screen that can reach the watch.

- **All four Garmin gates render, and each names its consequence.** The ribbon
  resolves `no-extension` / `export-disabled` / `no-session` / `ready` through
  one `useGarminGate` hook and states what broke, what it costs, and the
  action that fixes it (principle 4/6) — including the previously invisible
  `!extensionInstalled`, which now explains that Garmin has no public workout
  API and offers the bridge install with `Download a file` as the fallback.
  When nothing needs the user the ribbon renders nothing (principle 2).

- **Five cards become one canvas.** `WorkoutSection` renders a title block, a
  single bordered canvas, and one action row. Inside the canvas: a `SHAPE`
  section head carrying the FTP the targets derive from, the chart as the
  index of the list beneath it, the step rows, the step form expanding **in
  place** under the row it belongs to, and the add-step/add-repetition footer.
  `WorkoutStats` and `WorkoutPreview` lose their own card chrome and are
  composed by the canvas.

- **Targets name the FTP they derive from, and where it came from.** The
  canvas head reads `Zones from FTP 268 W · updated 4 days ago` from the
  athlete profile for the workout's sport. Provenance is stated only as far as
  the data supports it: the profile records `updatedAt`, not a per-threshold
  source, so the line says "updated", never "from Garmin". With no FTP set it
  says so and points at the profile instead of inventing a number.

- **The repetition block goes neutral.** Dashed brand-blue chrome becomes an
  elevated surface with a hairline edge and a neutral `Repeat N×` chip. The
  only colour left on the screen is the steps' zones.

- **`utils/step-colors.ts` returns zone roles.** Seven literal hues
  (`#3b82f6`, `#8b5cf6`, `#10b981`, `#06b6d4`, `#6b7280`, `#ef4444`,
  `#f59e0b`) become `var(--zone-1..5)`, mapped by intensity rather than by
  target type: a step's colour is its training zone or nothing. The canvas
  thumbnail renderer, which draws to a `<canvas>` and cannot resolve a CSS
  variable, resolves the role against the live document instead of keeping a
  frozen hex mirror.

- **Slate/gray is repainted to roles in every file this change touches**
  (issue #1121), which is every editor surface listed above.

## Capabilities

### Modified Capabilities

- `spa-workout-state-machine`: `structured → ready` is no longer a user-facing
  decision. The send action performs the ready transition and the pushed
  transition as one operation; the states and their invariants are unchanged.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application-port or adapter change; no dependency added; no Dexie version
  bump; no changeset (the SPA is excluded from the PUBLISHABLE set).
- **Deleted**: `EditorWorkflowBar`, `ModifiedIndicator`,
  `GarminExportDisabledButton`, `GarminNoSessionButton` — their meaning moves
  into `EditorStateRibbon`, which states it in full sentences instead of in a
  disabled button's label.
- **i18n**: three canonical verbs land in `common.json` as `verbs.send` /
  `verbs.keep` / `verbs.download` so every namespace names them identically.
  `editor.json` gains a `ribbon.*` group and loses `workflow.acceptWorkout` /
  `workflow.pushToGarmin`; `save.saveWorkout` is renamed to `save.download`.
  `library.json` gains `actions.keep` **additively** — no existing library key
  is renamed, because a parallel wave owns that namespace. Both locales,
  covered by `resource-parity.test.ts`.
- **Behaviour change**: pushing from `structured` no longer requires a prior
  Accept click. A workout that reached `pushed` and was then edited shows the
  ribbon instead of an amber banner.
- **e2e**: `workflow-bar` is replaced by `editor-state-ribbon`;
  `modified-indicator` is gone. `workout-section`, `editor-root`,
  `step-card`, `add-step-button` and `discard-workout-button` keep their
  identity.
