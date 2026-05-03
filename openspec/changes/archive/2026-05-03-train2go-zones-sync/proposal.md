> Completed: 2026-05-03

## Why

Today the user manually duplicates threshold values (FTP, LTHR, threshold pace, max HR, body weight) from `app.train2go.com/user/details` into Kaiord's Profile Manager → Training Zones. Train2Go is the source of truth — the user's coach configures the zones there — and the duplication is a friction point that surfaced during the bridge-popup-redesign manual e2e (PR #447): even after linking Train2Go and seeing "Connected as Pablo · Coach: Daniel" in the popup, the athlete card stays empty until the user re-types every value by hand.

## What Changes

- Add an opt-in **"Sync zones"** toggle to the Linked Account row (`LinkedAccountsSection`). Default off.
- When the toggle is ON for a linked Train2Go account:
  - **At link time** (auto): `attemptLink` success branch fans out into a zones-sync after the link is persisted.
  - **On manual "Sync"** click in the calendar header: piggyback a zones fetch on the existing weekly sync action.
  - **Never** on heartbeat / periodic detection — same anti-pattern `attempt-link.ts` already warns against (heartbeats must not silently mutate profile data).
- New bridge action `read-details`. Train2Go content-script ALLOWED list adds `GET /user/details` (resolved during the apply-phase spike: T2G renders zones inline in HTML, no separate JSON endpoint exists).
- New capability string `read:training-zones` added to the bridge's `BRIDGE_MANIFEST.capabilities` array. The SPA gates the "Sync zones" toggle on `bridge.capabilities.includes("read:training-zones")` so users with an older bridge version never see a feature their extension cannot fulfil.
- New SPA application use case `syncZones(profileId, transport)` that:
  - Fetches the zones payload via the transport.
  - Maps T2G shape → Kaiord profile schema (`cycling.thresholds.ftp`, `cycling.thresholds.lthr` from cycling HR `z4Upper`, `running.thresholds.lthr` from running HR `z4Upper`, `running.thresholds.thresholdPaceSecPerKm`, `swimming.thresholds.cssPaceSecPer100m`, `heartRate.max`, `bodyWeight`). Swimming's LTHR is currently not used by Kaiord — it is left unmapped.
  - Reconciles against the persisted profile with the conflict policy below.
- **Conflict policy**: empty Kaiord fields are filled silently. Fields that already have a value AND differ from Train2Go open a single dialog showing the per-field diff (`FTP: 200 → 270`); the user accepts or rejects each. No silent overwrites. No "Train2Go always wins".
- `bodyWeight` and `heartRate.max` are sourced from the **`/user/details` physiological block** (`payload.physiological.weight` / `payload.physiological.bpmMax`), same as the threshold values. The `/profile/ping` payload's `data.user.weight` / `data.user.bpm_max` remain an independent source used by the heartbeat / Profile Manager status display only — zones-sync does NOT consult them.
- Privacy surface: bridge `host_permissions` and content-script ALLOWED list expand to read training-zone data. Privacy-surface golden (`scripts/fixtures/bridge-privacy-surface.json`) is updated. Chrome Web Store listing copy mentions broadened read access.
- **Out of v1**: full Z1-Z5 zone tables. Those are derivable from threshold + zone-method (Coggan-7, etc.) — implementing them would duplicate logic Kaiord already has.

## Capabilities

### New Capabilities

- `train2go-zones-sync`: opt-in propagation of athlete threshold and physiological values from Train2Go into the active Kaiord profile, with explicit-trigger semantics (link / manual sync) and "ask before overwrite" conflict resolution.

### Modified Capabilities

- `train2go-bridge`: ALLOWED endpoint list expands to include the zones endpoint(s); a new `read-details` action joins `ping` / `read-week` / `read-day` in the bridge protocol.
- `spa-train2go-extension`: the SPA-side transport gains a `readZones(externalUserId)` method; the Linked-Account row exposes a "Sync zones" toggle; the connect callback fans out into a zones sync when the toggle is on.

## Impact

**Affected packages:**

- `@kaiord/train2go-bridge` — new ALLOWED entries, new action handler, new permission scope (read-only fetch through existing tab)
- `@kaiord/workout-spa-editor` — new use case `syncZones`, new transport method, new toggle UI, new conflict-resolution dialog, new persistence write path on Profile

**Privacy / store impact:**

- `scripts/fixtures/bridge-privacy-surface.json` golden updated
- `packages/train2go-bridge/store-listing.md` updated to mention zones read access
- No new Chrome permissions strings (still uses `host_permissions: app.train2go.com/*`); the surface widens within an already-granted host

**No public API breakage.** The opt-in toggle defaults off; users who upgrade do not see behavior changes until they explicitly turn it on.
