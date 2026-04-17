> Completed: 2026-04-15

## Why

The Settings panel only shows Garmin Bridge status in its "Garmin" tab. With Train2Go Bridge now integrated, there is no UI for users to see its connection status or troubleshoot detection issues. Additionally, several user-facing strings still reference only "Garmin Connect" when both platforms are now supported.

## What Changes

- Rename the Settings "Garmin" tab to "Extensions" (or "Bridges") to reflect it covers multiple bridge extensions, not just Garmin
- Add a Train2Go Bridge status section to the renamed tab, mirroring the existing Garmin Bridge section pattern (detection status, session status, refresh button)
- Update the FirstVisitState Connect card description from "Link a platform like Garmin Connect" to mention both platforms
- Update the NoBridgesState message from "e.g., Garmin Connect" to include Train2Go

## Capabilities

### New Capabilities

_(none — this extends existing UI, no new domain capabilities)_

### Modified Capabilities

- `spa-garmin-extension`: The Settings tab is renamed from "Garmin" to "Extensions" and now hosts multiple bridge status sections instead of a single Garmin section
- `spa-train2go-extension`: Add requirement for Train2Go status display in Settings panel (currently spec only covers detection and calendar integration, not settings UI)

## Impact

- **Package**: `@kaiord/workout-spa-editor` only
- **Layer**: UI components (presentational + hooks)
- **Files affected**:
  - `SettingsPanel/types.ts` — rename tab type
  - `SettingsPanel/SettingsPanel.tsx` — rename tab label
  - `SettingsPanel/GarminTab.tsx` — add Train2Go section (or split into ExtensionsTab)
  - `SettingsPanel/GarminStatus.tsx` — may generalize or keep as-is
  - New: `SettingsPanel/Train2GoStatus.tsx` — Train2Go-specific status display
  - `CalendarEmptyStates/FirstVisitState.tsx` — update Connect card copy
  - `CalendarEmptyStates/NoBridgesState.tsx` — update message copy
  - Tests for all modified components
- **No breaking changes** to public API or domain
- **No new dependencies**
