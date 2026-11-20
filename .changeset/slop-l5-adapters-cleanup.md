---
"@kaiord/zwo": patch
"@kaiord/fit": patch
"@kaiord/tcx": patch
---

Internal cleanup with no behaviour change: drop test-only helpers and an unused duration module from `@kaiord/zwo` (reusing core `isRepetitionBlock`/`zoneToPercentFtp`), derive `FitTargetData` from `FitWorkoutStep` and remove an unreachable equipment fallback in `@kaiord/fit`, and document that `@kaiord/tcx`'s `createXsdTcxValidator` only checks XML well-formedness. Writer output is unchanged for valid KRD; the only difference is that a malformed step carrying `repeatCount` but no `steps` is now encoded as a plain step by the Zwift writer instead of throwing a `TypeError`.
