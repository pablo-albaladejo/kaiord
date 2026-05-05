---
"@kaiord/core": minor
---

Extract the 7-band Coggan power-zone-to-percent-FTP table into a pure domain helper at `packages/core/src/domain/zones/power-zones.ts`. Adds new exports to the public API of `@kaiord/core` (additive only — no removals, no signature changes):

- `POWER_ZONES`, `POWER_ZONE_PERCENT_FTP` — readonly constants
- `PowerZone` — type alias for `1 | 2 | 3 | 4 | 5 | 6 | 7`
- `isPowerZone(value)` — type guard
- `zoneToPercentFtp(zone)` — strict mapping; throws `RangeError` on invalid input (does NOT silently fall back to 100% like the legacy zwo copy)
- `percentFtpToZone(percent)` — strict inverse for round-trip identity

The single in-repo duplicate (`packages/zwo/src/adapters/target/power.converter.ts`) will migrate to consume this helper in a follow-up PR (§6.2 of `repo-quality-maintenance-waves`).
