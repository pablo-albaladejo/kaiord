---
"@kaiord/workout-spa-editor": minor
---

Conflict dialog grouped by sport-kind table + FTP/power-bands coupling (PR 4 of 6 of `zones-method-aware-reconcile`).

**UX behavior change:** the conflict dialog no longer renders a 30-row scroll-fest of per-band-bound rows. Band-level conflicts are grouped into a single decision unit per `<sport>.<kind>` table (e.g., "Cycling HR Zones — 5 bands differ") with one [Accept Train2Go] / [Keep current] radio plus an expandable [Detail] view showing per-band rows.

When the FTP scalar is in conflicts AND any cycling.powerZones bands are also in conflicts, the dialog couples them into a single "Cycling threshold + zones" decision unit (per D-MA6) — accepting either implies accepting both, since power bands are stored as %FTP and accepting one without the other creates display inconsistency.

**New components:**

- `group-conflicts.ts` — partitions conflicts into scalars / band groups / coupled FTP+power.
- `ConflictGroup.tsx` — single group row with header, accept/reject radio, expandable detail.
- `ConflictGroupHeader.tsx`, `ConflictGroupRadios.tsx`, `ConflictGroupDetail.tsx`, `ConflictGroupList.tsx`, `DialogShell.tsx` — extracted from the dialog to fit React 60-line component cap.
- `use-conflict-decisions.ts` — owns per-row + per-group decision + expand state.

**Test changes:**

- 3 PR-3-era band tests rewritten to use group testids (5.2a/b/c).
- 1 new test for FTP+power-bands coupling (5.2d / D-MA6).
- Total 3262 tests pass (3261 → 3262).

Existing per-band testids (`zones-conflict-row-<field>`) are preserved INSIDE the expandable Detail view (DOM persists, hidden via `aria-hidden`).
