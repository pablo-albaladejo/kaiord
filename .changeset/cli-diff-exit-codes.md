---
"@kaiord/cli": patch
---

Fix `kaiord diff` exiting with 99 (unknown error) for every failure. It now maps errors like the other commands: a missing file exits 2, an unsupported format 1, and an invalid KRD 5.
