# Tasks

## 1. The three verbs

- [x] 1.1 Add `verbs.send` / `verbs.keep` / `verbs.download` to `common.json`
      in both locales — one canonical string per intention, so no namespace
      re-words them.
- [x] 1.2 `SaveButton`: `save.saveWorkout` → `save.download`
      ("Download a file"). Keep `save.saving` and the format selector.
- [x] 1.3 `SaveToLibraryButton`: label reads `library:actions.keep`
      ("Keep in library"), added additively. The dialog keeps its own title.
- [x] 1.4 `StepEditorActions`: `stepEditor.save` value becomes "Done"; the
      key stays so no call site moves.
- [x] 1.5 `PushButton` (workout detail) and `MatchedActions` (coaching) read
      `common:verbs.send`.
- [x] 1.6 `palette.json` save command and `create-workout.json`
      `result.savePush` / `toast.savedAndPushed` adopt the same three verbs.
- [x] 1.7 Delete `workflow.acceptWorkout` and `workflow.pushToGarmin`.

## 2. One push path, four gates

- [x] 2.1 `use-garmin-gate.ts`: resolve extension discovery, export policy and
      session into one `GarminGate` union. Sole owner of the gate decision.
- [x] 2.2 `ribbon-content.ts`: map (gate, workout state) → headline, detail and
      action ids. Return `null` when nothing needs the user (principle 2).
- [x] 2.3 `EditorStateRibbon.tsx` + `RibbonPanel.tsx`: render the message and
      hand its primary slot to `GarminPushButton`, its secondary to the fix
      (install / route / sign in) or to Download.
- [x] 2.4 `GarminPushButton` loses its gating and its `null` return; it is the
      one send control and always renders when the ribbon mounts it.
- [x] 2.5 Delete `GarminExportDisabledButton`, `GarminNoSessionButton`,
      `ModifiedIndicator`, `EditorWorkflowBar`.
- [x] 2.6 `useEditorActions.pushWorkout` folds the `structured → ready`
      transition into the send so Accept has no reason to exist.
- [x] 2.7 `PushFeedback` drops green/red literals for role tokens; success is
      a sentence, not a colour.

## 3. One canvas

- [x] 3.1 `EditorCanvas.tsx`: the single bordered surface (`--radius-card`,
      `border-edge-soft`, `overflow-hidden`) that hosts head, rows and footer.
- [x] 3.2 `CanvasShapeHead.tsx`: `SHAPE` section head + the FTP provenance
      line + `WorkoutPreview` as the list index.
- [x] 3.3 `workout-ftp-provenance.ts`: read the FTP for the workout's sport
      from the active profile and state only what the record supports —
      "updated {relative}", never a source the profile does not store.
- [x] 3.4 `WorkoutStats` and `WorkoutPreview` render bare; the canvas owns the
      chrome.
- [x] 3.5 The step form expands in place: `WorkoutList` renders `StepEditor`
      directly under the selected row instead of above the list.
- [x] 3.6 `WorkoutSection` composes title block → canvas → one action row;
      `WorkoutSectionEditor` becomes the per-row renderer the list calls, and
      the ribbon mounts a level up in `EditorPage`, above the canvas.
- [x] 3.7 The action row is `Keep in library` · format + `Download a file` ·
      `Discard workout`, with no send control.

## 4. Colour

- [x] 4.1 `step-colors.ts` returns `var(--zone-N)` by intensity; the target
      type no longer chooses a hue.
- [x] 4.2 `thumbnail/step-colors.ts` becomes the resolver for the `<canvas>`
      thumbnail — read the role off the live document rather than freezing a
      hex mirror.
- [x] 4.3 Repetition block: neutral surface, hairline edge, neutral chip.
- [x] 4.4 `WorkoutPreviewBar` selection ring uses `--focus-ring`.
- [x] 4.5 Repaint slate/gray → roles in every file touched (#1121).

## 5. Verification

- [x] 5.1 Update the tests that pin the retired verbs and the deleted
      components.
- [x] 5.2 `pnpm -r build` → package tests → `pnpm lint` → `tsc -b` →
      `pnpm lint:specs`.
- [x] 5.3 Both themes on `/workout/:id`.
