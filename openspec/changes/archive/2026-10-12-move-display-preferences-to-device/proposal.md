> Completed: 2026-10-12

# Proposal: Language, units and notifications belong to the device

## Why

`units`, `locale` and `notificationsEnabled` were stored in the per-profile
`userPreferences` row, and the units and locale providers read the active
profile. Switching athlete therefore switched the app's language and units:
Spanish + Imperial on profile 1, then activating profile 2 brought back
English + Metric (audit finding P-04, verified in production). These choices
describe the person reading the screen on this device, not the athlete.

## What Changes

- New device-preferences store (`lib/device-preferences.ts`) in this browser's
  localStorage under `kaiord-device-preferences`, like the theme. Reads and
  writes survive a throwing storage accessor by keeping the values in memory
  for the session.
- `UnitsProvider`, `LocaleProvider`, the Settings Preferences tab and the
  Settings index values read and write the device record through
  `useDevicePreferences`.
- Migration: on the first boot without a device record, the active profile's
  legacy values are copied to the device once. After that the profile values
  are never read for these fields.
- The legacy fields stay in the profile schema and are preserved on write, so
  older app versions syncing the same Drive snapshot keep working. They are no
  longer writable through `setUserPreferenceFields`.
- `activeSport`, coach marks and the setup checklist stay per profile.

## Impact

- The device record never travels in the Drive snapshot.
- `locale: "auto"` (or nothing set) still follows the browser language.
