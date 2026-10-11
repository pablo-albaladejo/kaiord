> Completed: 2026-10-11

# Proposal: TCX import reads repetition blocks

## Why

Importing `WorkoutRepeatBlocks.tcx` in the SPA produced a two-step workout:
the warm-up and the cool-down. The 5× work/rest block was gone, and the only
trace was a console line, "Repetition blocks not yet supported" (audit finding
F-22).

The TCX reader's step converter returned `null` for every `Repeat_t`. The
writer already emitted `Repeat_t` for KRD repetition blocks, so a KRD → TCX →
KRD round trip silently lost every block, and the round-trip test meant to
guard it compared two KRDs that had both lost the block, so it passed. Nothing
in the SPA could show the loss: format readers report what they drop through
their logger, and the SPA used the default console logger.

## What Changes

- `@kaiord/tcx` maps a `Repeat_t` to a KRD repetition block: `Repetitions`
  becomes `repeatCount`, each `Child` a step. A nested `Repeat_t` is unrolled
  into its parent, a repeat without a valid count is imported once, and a
  repeat with no importable step is dropped; each announces a
  `Lossy conversion:` warning.
- The SPA's TCX import collects the reader's warnings, and `FileUpload`
  reports them through `onWarnings`. The editor's import overlay and the
  converter show an "Imported with warnings" toast.
- Tests: converter units, a fixture test of `WorkoutRepeatBlocks.tcx`, a
  TCX → KRD → TCX → KRD step-equality test, a FIT → TCX → KRD repeat test, and
  a Playwright spec importing the fixture through the editor.

## Impact

- `packages/tcx/src/adapters/workout/` — new `repeat-block.converter.ts`;
  `workout.converter.ts` routes `Repeat_t` to it.
- `packages/workout-spa-editor/src/` — import pipeline, `FileUpload`,
  `ImportDropzoneOverlay`, `ConvertFlow`, `import` locale namespace.
- `e2e/tcx-repeat-import.spec.ts` touches the SPA, so CI's `frontend-changed`
  gate runs the e2e suite against the workspace `@kaiord/tcx`.
