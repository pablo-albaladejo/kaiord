---
"@kaiord/workout-spa-editor": patch
---

Add AI batch cost-confirmation dialog and Settings → Usage panel.

The batch banner's "Process all with AI" button now opens a confirmation dialog showing the configured provider, estimated tokens (chars/3 heuristic), and estimated USD cost (per-provider blended rate) before dispatching the run. The new Settings → Usage tab renders cumulative AI token usage and cost for the current month plus the previous five, read live from the Dexie `usage` table.

Closes the remaining two findings from the 2026-04-18 opsx-sync audit (`address-opsx-sync-drift`).
