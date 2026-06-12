---
"@kaiord/cli": minor
"@kaiord/garmin": patch
"@kaiord/core": patch
"@kaiord/fit": patch
"@kaiord/tcx": patch
"@kaiord/zwo": patch
"@kaiord/garmin-connect": patch
"@kaiord/ai": patch
"@kaiord/mcp": patch
---

feat(cli): semantic failure exit codes. A single typed `mapErrorToExitCode` replaces the previous divergent mappers and message-substring matching; new `ENVIRONMENT_ERROR` (missing bundled schema/dependency → reinstall hint) and `SERVICE_ERROR` (Garmin Connect API/network) codes mean environmental and external-service failures no longer collapse into `UNKNOWN_ERROR`. A single `FORMAT_REGISTRY` now sources the format vocabulary.

fix(garmin): `WorkoutSummary.sport` now carries KRD sport vocabulary (via the sport mapper) instead of the raw Garmin `sportTypeKey`.

Internal semantic hardening with no other behavior changes: lossy adapter conversions (zwo watts→%FTP, garmin truncation / unknown-enum / REPS, tcx-zwo intensity narrowing) now emit named `Lossy conversion:` warnings with named assumed/fallback constants; duplicated domain rules are single-sourced (fit bpm offset and zone bounds, fit FIT-timestamp helper, core health version gate, garmin-connect retry policy); core round-trip methods gained honest port-level names (`validateBinaryRoundTrip`/`validateKrdRoundTrip`) with deprecated FIT-named aliases; MCP tool errors carry a machine-readable `structuredContent.error` classification and `kaiord_get_recovery_status` reports `skipped`.
