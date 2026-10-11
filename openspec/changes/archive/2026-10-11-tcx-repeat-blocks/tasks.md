# Tasks

> Tasks: 5 completed, 0 deferred

- [x] 1. Read `Repeat_t` into a KRD repetition block (nested repeats unrolled, invalid count imported once, empty repeat dropped, each with a `Lossy conversion:` warning).
- [x] 2. Fixture, round-trip (TCX → KRD → TCX → KRD) and FIT → TCX → KRD tests for repeats; replace the round-trip test that passed with the block dropped on both sides.
- [x] 3. Collect the TCX reader's warnings in the SPA import and expose them through `FileUpload`'s `onWarnings`.
- [x] 4. Show an "Imported with warnings" toast from the editor import overlay and the converter.
- [x] 5. Playwright spec importing `WorkoutRepeatBlocks.tcx` through the editor and asserting the 5× block.
