## 1. Rename Garmin tab to Extensions

- [x] 1.1 Update `SettingsPanel/types.ts`: rename `"garmin"` to `"extensions"` in `SettingsTab` union
- [x] 1.2 Update `SettingsPanel/SettingsPanel.tsx`: rename tab label from "Garmin" to "Extensions" and update `TAB_CONTENT` key
- [x] 1.3 Rename `GarminTab.tsx` to `ExtensionsTab.tsx`, update imports
- [x] 1.4 Update `SettingsPanel.test.tsx` for the renamed tab

## 2. Add Train2Go status component

- [x] 2.1 Create `SettingsPanel/Train2GoStatus.tsx` following `GarminStatus.tsx` pattern (not installed / no session / connected)
- [x] 2.2 Add Train2Go section to `ExtensionsTab.tsx` below Garmin section, using `useTrain2GoStore()` for state
- [x] 2.3 Add tests for `Train2GoStatus.tsx`
- [x] 2.4 Add tests for the updated `ExtensionsTab.tsx` (both sections render)

## 3. Update empty state copy

- [x] 3.1 Update `FirstVisitState.tsx` Connect card description to "Link Garmin Connect, Train2Go, or other platforms"
- [x] 3.2 Update `NoBridgesState.tsx` message to "e.g., Garmin Connect, Train2Go"
- [x] 3.3 Update tests for `FirstVisitState` and `NoBridgesState` copy changes

## 4. Verify and finalize

- [x] 4.1 Run full test suite, fix any broken tests
- [x] 4.2 Run lint and type check
- [x] 4.3 Visual verification in dev server (Settings > Extensions tab shows both sections)
- [x] 4.4 Create changeset
