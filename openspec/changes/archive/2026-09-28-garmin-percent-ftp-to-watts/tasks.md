# Tasks

## 1. Core

- [x] 1.1 `MissingFtpError` + factory, exported from `@kaiord/core`.
- [x] 1.2 `PushOptions` on `WorkoutService.push`.

## 2. Writer

- [x] 2.1 Resolve `percent_ftp` with `ftpWatts` in the GCN power target
      converter; throw `MissingFtpError` when the FTP is missing or invalid.
- [x] 2.2 Unit tests (85 % @ 250 W → 213 W, rounding, invalid FTPs, watts,
      ranges and zones unchanged) and a public `createGarminWriter` test.

## 3. Callers

- [x] 3.1 garmin-connect push forwards the FTP; `MissingFtpError` unwrapped.
- [x] 3.2 CLI `--ftp` on `convert` and `garmin push`, exit code and
      suggestion; ZWO → GCN integration test.
- [x] 3.3 MCP `ftp` parameter and `missing-ftp` classification.
- [x] 3.4 SPA: athlete-profile FTP on export, push button and chat push;
      EN + ES message; no push without an FTP.
- [x] 3.5 garmin-bridge checked: it only receives GCN, no change.

## 4. Docs

- [x] 4.1 `zwo-to-garmin`, `fit-to-garmin`, CLI and MCP references.
