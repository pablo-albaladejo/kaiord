# Design: Sport-Specific Training Zones

## Context

The SPA's Profile type (`packages/workout-spa-editor/src/types/profile.ts`) currently has global `powerZones: Array<PowerZone>`, `heartRateZones: Array<HeartRateZone>`, `ftp?: number`, `maxHeartRate?: number`. These need restructuring into per-sport zone configurations.

## Goals

- Each sport has its own set of zones and thresholds
- Users can choose auto-calculated or manual for each zone type
- The AI Generator only injects relevant zones for the selected sport
- Existing profiles migrate transparently

## Non-Goals

- Pace zones in `@kaiord/core` domain schemas (stays SPA-only for now)
- Zone-aware workout validation (checking that step targets match zones)
- Multi-threshold support per zone type (e.g., separate aerobic/anaerobic thresholds)

## Decisions

### D1: Sport zones as a record in Profile

**Layer:** Adapters (SPA types)

**Decision:** Replace top-level `powerZones`/`heartRateZones`/`ftp`/`maxHeartRate` with:
```ts
type SportZoneConfig = {
  thresholds: SportThresholds;
  heartRateZones: { mode: "auto" | "manual"; zones: Array<HeartRateZone> };
  powerZones?: { mode: "auto" | "manual"; zones: Array<PowerZone> };
  paceZones?: { mode: "auto" | "manual"; zones: Array<PaceZone> };
};

type Profile = {
  id: string;
  name: string;
  bodyWeight?: number;
  sportZones: Record<Sport, SportZoneConfig>;
  // ftp, maxHeartRate, powerZones, heartRateZones removed
};
```

**Rationale:** A record keyed by sport is clean, extensible, and makes it clear which zones belong to which sport. The `mode` field per zone type enables the auto/manual toggle.

### D2: Threshold types per sport

**Layer:** Adapters (SPA types)

**Decision:**
```ts
type SportThresholds = {
  lthr?: number;           // All sports
  ftp?: number;            // Cycling, Running
  thresholdPace?: number;  // Running (sec/km), Swimming (sec/100m)
  paceUnit?: "min_per_km" | "min_per_100m";
};
```

**Rationale:** A single flat object with optional fields. Each sport uses only its relevant thresholds. The `paceUnit` disambiguates between running and swimming pace.

### D3: Auto-calculation formulas

**Layer:** Adapters (SPA)

**Decision:**
- **HR zones (5):** Percentage of LTHR — Z1: <82%, Z2: 82-89%, Z3: 89-94%, Z4: 94-100%, Z5: >100%
- **Power zones (7):** Coggan's model — same as current `DEFAULT_POWER_ZONES` percentages of FTP
- **Pace zones (5):** Percentage of threshold pace — Z1: >115%, Z2: 108-115%, Z3: 100-108%, Z4: 93-100%, Z5: <93% (inverted because slower = higher time)

**Rationale:** Industry-standard formulas used by TrainingPeaks, Garmin, Strava.

### D4: Migration strategy

**Layer:** Adapters (SPA persistence)

**Decision:** A migration function in `profile-store/migration.ts` that:
1. Detects profiles with legacy top-level zones (no `sportZones` key)
2. Creates `sportZones` with cycling + generic configs from the legacy data
3. Removes legacy fields
4. Persists the migrated profile

Migration runs at profile load time, once per profile.

**Rationale:** Transparent, automatic, no user action needed. The old data is preserved in the new structure.

### D5: Zone Editor as tabs inside Profile Manager

**Layer:** Adapters (SPA UI)

**Decision:** Inside the Profile Manager's edit view, add a tabbed zone editor:
- 4 tabs: Cycling, Running, Swimming, Generic
- Each tab shows the available zone types for that sport
- Per zone type: a toggle switch (Auto/Manual) + threshold input (auto) or editable table (manual)

**Rationale:** Follows TrainingPeaks UX. Tabs keep the UI clean despite the complexity.

### D6: Zone indicator in AI Generator

**Layer:** Adapters (SPA UI)

**Decision:** A small informational bar below the sport selector in `AiWorkoutForm`:
- Shows profile name + relevant thresholds for the selected sport
- If no profile: "Set up a profile with training zones for better results" with link
- If no zones for selected sport: "No {sport} zones configured" with link

**Rationale:** Users need to know what context the LLM receives. Makes the connection between Profile Manager and AI Generator explicit.

### D7: zones-formatter sport-aware

**Layer:** Adapters (SPA lib)

**Decision:** `formatZonesContext(profile, sport?)` becomes sport-aware:
- If sport is provided: only include that sport's zones
- If no sport: include all zones (backward compatible)
- Format thresholds first, then zones by type

**Rationale:** The LLM only needs relevant zones. Injecting cycling power zones for a swimming prompt is noise.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Migration corrupts existing profiles | Migration is additive — legacy fields are copied, not moved. Add rollback in case of error. |
| UI complexity in Profile Manager | Keep auto mode as default — most users only need to set a threshold. Manual is for power users. |
| Pace zone calculation edge cases | Add sensible defaults and min/max bounds. Validate threshold input. |

## Open Questions

None.
