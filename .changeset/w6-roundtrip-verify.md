---
"@kaiord/zwo": none
---

chore(verify): confirm W6 round-trip integrity post power-zone migration (§6.3)

Read-only verification pass confirming that the W6.1 + W6.2 power-zone domain
extraction introduced no regressions in any adapter round-trip suite. All
tolerances held within spec limits (time ±1s, power ±1W or ±1%FTP, HR ±1bpm,
cadence ±1rpm, distance ±1m).

Test matrix results:

| Suite                       | Files | Tests | Result |
| --------------------------- | ----- | ----- | ------ |
| `@kaiord/core` zones (§6.1) | 1     | 64    | PASS   |
| `@kaiord/core` round-trip   | 1     | 11    | PASS   |
| `@kaiord/zwo` (incl. RT)    | 14    | 224   | PASS   |
| `@kaiord/fit` (incl. RT)    | 32    | 441   | PASS   |
| `@kaiord/tcx` (incl. RT)    | 28    | 386   | PASS   |
| `@kaiord/garmin` round-trip | 1     | 6     | PASS   |

W6.1 took the exhaustive-enumeration path for property coverage (no fast-check
dependency added) — all 7 Coggan power zones exercised via named constants.
No tolerance has tightened in practice; proposed table is unchanged.

Settles §6.3 of `repo-quality-maintenance-waves`.
