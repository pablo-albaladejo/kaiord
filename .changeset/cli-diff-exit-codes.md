---
"@kaiord/cli": patch
---

Fix `kaiord diff` exiting with 99 (unknown error) for every failure. It now maps errors like the other commands: a missing file exits 2, an unsupported format 1, and an invalid KRD 5.

`kaiord diff` now applies `.kaiordrc.json` defaults (`json`, `verbose`, `quiet`, `logFormat`), so `json: true` in the config reports diff failures as JSON on stdout. `kaiord extract-workout --json` now reports failures as JSON on stdout instead of text on stderr.
