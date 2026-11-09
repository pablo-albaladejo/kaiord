---
"@kaiord/cli": patch
---

Fix `kaiord diff` exiting with 99 (unknown error) for every failure. It now maps errors like the other commands: a missing file exits 2, an unsupported format 1, and an invalid KRD 5.

`kaiord diff` now applies `.kaiordrc.json` defaults (`json`, `verbose`, `quiet`, `logFormat`), so `json: true` in the config switches diff to JSON output, for its results as well as its failures, like the other commands. Options that fail validation are now reported through the normal error output instead of an unhandled rejection. `kaiord extract-workout --json` now reports failures as JSON on stdout instead of text on stderr. Invalid options now exit 1 (invalid argument) instead of 99 (unknown error), and `--json` (or the config's `json: true`) is honoured for that failure in `inspect`, `validate`, `extract-workout` and `diff`, so the error comes out as JSON on stdout.
