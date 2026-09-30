# Tasks

## 1. Export route control (D1)

- [x] 1.1 Derive export toggles per data type from the registry and the bridge's announced export token
- [x] 1.2 Render the switches in the "Also sent to" row, writing through `upsertIntegrationPolicy` with the stored mode preserved
- [x] 1.3 Link the no-export-route placement feedback and the Send week preflight to Connections

## 2. Link seeds import routes (D2)

- [x] 2.1 Add `seedImportRoutesOnLink` (registry-derived, seed-only)
- [x] 2.2 Call it after a successful Train2Go link and after a Connections reconnect

## 3. Connect CTA for unlinked sources (D3)

- [x] 3.1 Render every available coaching source in the calendar nav row; unlinked sources show "Connect to <Label>"
- [x] 3.2 Coaching cards on Connections state an unlinked active profile and offer the link

## 4. Live first-run guide (D4)

- [x] 4.1 Tick steps from live state (linked source, AI provider, Garmin bridge)
- [x] 4.2 Yield to coaching plans; count them as prose for the missing-key banner
- [x] 4.3 E2E: a week of coaching plans with no workouts shows the missing-key banner, not the guide
