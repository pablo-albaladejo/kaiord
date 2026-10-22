---
"@kaiord/zwo": minor
---

Zwift `Warmup`, `Cooldown` and `Ramp` blocks are now read as power ranges with `basis: "percent_ftp"` instead of unmarked ranges whose percentages looked like watts, and those ranges are written back as their original `PowerLow`/`PowerHigh` FTP fractions. Previously a native ramp written back to ZWO was treated as watts and rescaled against an assumed 250 W FTP.

Descending blocks (a `Cooldown` or `Ramp` with `PowerLow` above `PowerHigh`) are read as an ascending range (`min` ≤ `max`) and flagged with `step.extensions.zwift.powerDirection: "descending"`, so they export to Garmin Connect and FIT instead of failing workout validation, and still write back to ZWO with their original `PowerLow`/`PowerHigh`. A `Cooldown` that ramps up is flagged `powerDirection: "ascending"`, and a cooldown without the flag (built in the editor or read from FIT) is written as a descending `Cooldown`, so Zwift no longer runs it as a ramp up. Read percentages are rounded to one decimal, and an unsupported `SteadyState` `PowerLow`/`PowerHigh` is now reported with a warning.

**Re-import ZWO workouts saved before this release.** KRD stored by an earlier version holds Zwift ramps as basis-less ranges, which still mean watts; they are not migrated. Import the original `.zwo` file again to get the % FTP ramp.

**Re-import the original Zwift file, not a Kaiord export.** A `.zwo` that an earlier version of Kaiord exported wrote ramps as `kaiord:powerUnit="watts"` with the percentages stored as watts, so re-importing that file still yields the wrong watts range. Import the original Zwift `.zwo` instead.
