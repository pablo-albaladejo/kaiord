---
"@kaiord/tcx": minor
---

The TCX reader now imports repetition blocks. A `Repeat_t` step becomes a KRD repetition block with its `Repetitions` count and its `Child` steps (durations, targets, intensity and names), the same shape the FIT reader produces, so a TCX → KRD → TCX → KRD round trip keeps the block. Before, every `Repeat_t` was dropped with only a console warning: an interval workout opened as its warm-up and cool-down alone. A repeat nested inside another, which a KRD block cannot hold, is unrolled into its parent (the workout performed is the same) and announced as a lossy conversion, as is a repeat with no valid `Repetitions` (its steps are imported once) or with no importable step (it is dropped).
