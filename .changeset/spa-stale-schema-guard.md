---
"@kaiord/workout-spa-editor": patch
---

Stop a tab whose code is older than the installed database instead of letting it patch the newer schema. Boot probes the database version before the first render and shows a blocking dialog when a newer deploy has upgraded it; a running tab closes its connection and shows the same dialog when another window upgrades. The dialog offers to download the open draft and reloads into the newer worker when one is waiting. Everything already saved stays in IndexedDB, untouched.
