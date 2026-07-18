---
"@kaiord/tcx": patch
---

Fix `fit → tcx` (and any `* → tcx`) conversions throwing `TcxParsingError` on
workouts with repeat/interval blocks (#976). The KRD→TCX writer treated every
step as a leaf, so a repetition block had no `duration`/`target` and the
encoder threw. The writer now serializes repetition blocks to a TCX `Repeat_t`
step carrying `Repetitions` and `Child` steps, assigning contiguous `StepId`s
across the flattened tree.
