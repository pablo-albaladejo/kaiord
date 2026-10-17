> Completed: 2026-09-28

# Proposal: Resolve percent-of-FTP power targets to watts in the GCN writer

## Why

`@kaiord/garmin` wrote a KRD `percent_ftp` power target into a Garmin Connect
`power.zone` target as if the percentage were watts: a Zwift step at 85 % FTP
reached Garmin Connect as an 85 W target (#1279). Garmin Connect workouts store
power targets in watts only, so a percentage cannot be written without the
athlete's FTP. The documentation promised an "assumed FTP" that the code never
applied.

## What Changes

- `@kaiord/core`: a typed `MissingFtpError`, and an optional
  `PushOptions = { ftpWatts?: number }` argument on `WorkoutService.push`.
- `@kaiord/garmin`: `GarminWriterOptions.ftpWatts`. A `percent_ftp` power
  target is written as `round(pct / 100 × ftpWatts)` watts. Without a positive,
  finite FTP the writer throws `MissingFtpError`; it never guesses one. Watts,
  watt ranges (still fastest-first) and power zones are unchanged.
- `@kaiord/garmin-connect`: `push(krd, { ftpWatts })` forwards the FTP to the
  writer and lets `MissingFtpError` through unwrapped, before any HTTP call.
- `@kaiord/cli`: `--ftp <watts>` on `convert` and `garmin push`; a missing FTP
  exits with `INVALID_ARGUMENT` and suggests `--ftp`.
- `@kaiord/mcp`: optional `ftp` on `kaiord_convert` and `kaiord_garmin_push`;
  the failure is classified as `missing-ftp`.
- Workout editor: export to GCN and "Send to Garmin" (button and chat tool) use
  the FTP of the workout's sport from the athlete profile, and show a localized
  (EN + ES) message instead of pushing when the profile has none.
- Docs: the "assumed FTP 250 W" gotcha is replaced with the real behaviour.

## Out of scope

- Zwift ramps (`Warmup`/`Cooldown`/`Ramp`): the ZWO reader emits them as a
  `range` whose bounds are % FTP, while KRD `range` means watts. KRD has no
  % FTP range, so the writer cannot tell them apart. Fixing it needs a KRD
  schema addition and is tracked separately.
- The FIT writer's power `range` branch and the TCX writer's dropped
  `percent_ftp` targets (different bugs, listed in the PR).
