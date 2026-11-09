---
"@kaiord/zwo": patch
"@kaiord/fit": patch
"@kaiord/tcx": patch
---

Internal cleanup with no behaviour change: drop test-only helpers and an unused duration module from `@kaiord/zwo` (reusing core `isRepetitionBlock`/`zoneToPercentFtp`), derive `FitTargetData` from `FitWorkoutStep` and remove an unreachable equipment fallback in `@kaiord/fit`, and document that `@kaiord/tcx`'s `createXsdTcxValidator` only checks XML well-formedness. Writer output is byte-identical.
