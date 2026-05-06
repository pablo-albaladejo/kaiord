---
"@kaiord/zwo": patch
---

Replace the inline 7-band Coggan power-zone table in `packages/zwo/src/adapters/target/power.converter.ts` with the canonical domain helper `zoneToPercentFtp` from `@kaiord/core` (added in W6.1). Public API of `@kaiord/zwo` is byte-identical — `convertPowerZoneToPercentFtp` is internal and unchanged at the call sites in `power-encoder.ts`.

Internal contract change for invalid zones: the legacy adapter silently fell back to 100% FTP; the helper now throws `RangeError`. The KRD `powerValueSchema` already constrains `unit: "zone"` values to `int().min(1).max(7)`, so every in-flight caller receives a validated zone — the legacy fallback was dead code that masked invalid input. Settles §6.2 of `repo-quality-maintenance-waves`.
