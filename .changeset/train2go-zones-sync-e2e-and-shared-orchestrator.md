---
"@kaiord/workout-spa-editor": patch
---

Train2Go zones-sync — Playwright e2e + shared orchestrator (closes #478).

- New `packages/workout-spa-editor/e2e/zones-sync.spec.ts` covers the three user-visible flows the unit tests can't fully exercise in a real browser: (a) toggle-off auto-sync MUST NOT issue `read-details`, (b) toggle-on with empty profile silently fills every threshold/physio value, (c) toggle-on with a manual FTP opens the `ZonesConflictDialog` with the diff. Stable across 5/5 runs in `pnpm exec playwright test --project=chromium`.
- New helpers `e2e/helpers/train2go-bridge-stub.ts` + `train2go-bridge-stub-page-script.ts` install a self-contained Train2Go bridge stub via `addInitScript`: stubs `chrome.runtime.sendMessage`, posts `KAIORD_BRIDGE_ANNOUNCE` (and re-posts on `KAIORD_BRIDGE_DISCOVER`), tracks every action call so tests can assert what fired (`read-details`) and what didn't.
- **Architectural fix**: lift the zones-sync orchestrator out of per-source instances into a single `Train2GoZonesSyncProvider` mounted at app root (inside `AppToastProvider`). Before this, the calendar header's sync button and the `LinkedAccountRow`'s mounted dialog used different orchestrator instances — clicking sync on the calendar set `pending` on instance A while the dialog was mounted under instance B. The provider now owns the state and renders the dialog itself, so any trigger surfaces the dialog regardless of which page is open. The calendar's call site (via the registry's `useTrain2GoSource` factory) and the Profile Manager's row both consume the same context.
- `useTrain2GoSource` no longer creates its own orchestrator; it reads from the new context. The `Train2GoSource.zonesSync` field is preserved for backwards compatibility (some tests reference it).
- `LinkedAccountRow` no longer renders `ZonesConflictDialog` (the provider does). `useLinkedAccountRow` no longer returns `zonesSync`.

This closes the integration gap that PR 3 (#474) shipped — the per-instance orchestrator design passed all 16 unit tests because each one tested in isolation, but the dialog never appeared in the calendar-triggered flow that PR 3 was supposed to wire up.
