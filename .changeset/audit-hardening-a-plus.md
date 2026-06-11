---
"@kaiord/core": minor
"@kaiord/fit": patch
"@kaiord/zwo": patch
"@kaiord/garmin": patch
"@kaiord/garmin-connect": patch
"@kaiord/cli": patch
---

Audit hardening: stricter domain validation and internal robustness.

- `@kaiord/core`: range targets (power/heart-rate/pace/cadence) now enforce
  `min <= max`; physical bounds added (watts 0-5000, percent FTP 0-1000,
  bpm 0-300, percent max 0-100, pace 0-30 m/s, cadence 0-300 rpm, pool
  length 1-655 m). Inputs outside these bounds — previously accepted
  silently — now fail schema validation. Internal layout: the round-trip
  validation use case moved into the `application` layer and the Profile
  Snapshot protocol contract into a new guarded `protocol/` layer; the
  public API surface is unchanged.
- `@kaiord/fit`, `@kaiord/zwo`, `@kaiord/garmin`, `@kaiord/garmin-connect`,
  `@kaiord/cli`: internal hardening under `noUncheckedIndexedAccess`
  (defensive guards on indexed access), converter renames, and test
  coverage expansion. No public API changes.
