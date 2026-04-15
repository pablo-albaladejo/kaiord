## Context

The Settings panel has a "Garmin" tab that shows Garmin Bridge extension status. With Train2Go Bridge now integrated, there is no UI for its status. The tab name and several copy strings only reference Garmin, despite Kaiord now supporting two bridge extensions.

Current structure:

- `SettingsPanel.tsx` → tabs: AI | Garmin | Privacy
- `GarminTab.tsx` → single section: Garmin Bridge Extension
- `GarminStatus.tsx` → status component for Garmin detection state
- `FirstVisitState.tsx` → "Link a platform like Garmin Connect"
- `NoBridgesState.tsx` → "e.g., Garmin Connect"

## Goals / Non-Goals

**Goals:**

- Show Train2Go Bridge status in Settings alongside Garmin
- Rename tab to reflect it covers all extensions
- Update platform-specific copy to be inclusive of both bridges
- Maintain existing Garmin UX unchanged

**Non-Goals:**

- Refactoring the bridge detection protocol (already works)
- Adding new Train2Go features (sync, calendar — already exist)
- Generalizing to N bridges with dynamic registry UI (two bridges is fine)

## Decisions

### D1: Rename tab from "Garmin" to "Extensions"

**Layer**: UI (presentational)

"Extensions" is generic enough to cover any future bridges while being clear. Alternatives considered:

- "Bridges" — too technical for end users
- "Integrations" — implies deeper platform coupling
- "Connections" — ambiguous with network connections

### D2: Keep GarminTab, add Train2Go section within it

Rename `GarminTab.tsx` → `ExtensionsTab.tsx`. It renders two sections stacked vertically:

1. Garmin Bridge Extension (existing `GarminStatus` component)
2. Train2Go Bridge Extension (new `Train2GoStatus` component)

Each section is self-contained with its own detect/refresh logic.

Alternative considered: separate tabs per bridge — rejected because two small sections don't warrant their own tabs, and the user wants to see all extension status at a glance.

### D3: Create Train2GoStatus mirroring GarminStatus pattern

New `Train2GoStatus.tsx` presentational component, same pattern as `GarminStatus.tsx`:

- Not installed → install prompt
- Installed, no session → "Connect to Train2Go" guidance
- Installed, session active → green "Connected to Train2Go" message

State comes from `useTrain2GoStore()` hook (already exists).

### D4: Update copy strings in empty states

Simple string updates, no structural changes:

- `FirstVisitState.tsx`: "Link a platform like Garmin Connect" → "Link Garmin Connect, Train2Go, or other platforms"
- `NoBridgesState.tsx`: "e.g., Garmin Connect" → "e.g., Garmin Connect, Train2Go"

## Risks / Trade-offs

- **[Risk] Tab rename breaks existing deep links or tests** → Low risk, no URL routing to tabs. Tests will need updating but are straightforward string changes.
- **[Trade-off] Two hardcoded sections vs dynamic bridge list** → Accepted. Dynamic registry UI is over-engineering for two bridges. Easy to refactor later if a third bridge appears.
