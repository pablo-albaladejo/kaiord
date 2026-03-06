# Tasks: Sport-Specific Training Zones

## 1. Domain Types (SPA)

- [ ] 1.1 Create `PaceZone` type: zone, name, minPace, maxPace, unit (min_per_km | min_per_100m)
- [ ] 1.2 Create `SportThresholds` type: lthr?, ftp?, thresholdPace?, paceUnit?
- [ ] 1.3 Create `ZoneConfig<T>` type: mode (auto | manual), zones Array<T>
- [ ] 1.4 Create `SportZoneConfig` type combining HR/power/pace zone configs per sport
- [ ] 1.5 Create `SPORT_ZONE_CAPABILITIES` constant mapping sport → available zone types
- [ ] 1.6 Update `Profile` type: replace top-level ftp/maxHeartRate/powerZones/heartRateZones with sportZones record
- [ ] 1.7 Test type definitions compile correctly

## 2. Zone Calculation

- [ ] 2.1 Create `calculate-hr-zones.ts`: 5 zones from LTHR using percentage model
- [ ] 2.2 Create `calculate-power-zones.ts`: 7 zones from FTP using Coggan's model
- [ ] 2.3 Create `calculate-pace-zones.ts`: 5 zones from threshold pace (supports both min/km and min/100m)
- [ ] 2.4 Test HR zone calculation: known LTHR → expected zone boundaries
- [ ] 2.5 Test power zone calculation: known FTP → expected zone boundaries
- [ ] 2.6 Test pace zone calculation: known threshold → expected zone boundaries (both units)

## 3. Profile Migration

- [ ] 3.1 Create `profile-migration.ts`: detect legacy profiles, migrate to sportZones structure
- [ ] 3.2 Migration: powerZones + ftp → sportZones.cycling
- [ ] 3.3 Migration: heartRateZones + maxHeartRate → sportZones.cycling.heartRateZones + sportZones.generic.heartRateZones
- [ ] 3.4 Migration: copy LTHR to all sports
- [ ] 3.5 Migration: default empty configs for running, swimming (no legacy data)
- [ ] 3.6 Test migration: legacy profile → migrated profile with correct structure
- [ ] 3.7 Test migration: already-migrated profile is not re-migrated
- [ ] 3.8 Integrate migration into profile load path (profile-store initial-state or persistence)

## 4. Profile Store Updates

- [ ] 4.1 Update profile-store actions: updateSportThresholds(profileId, sport, thresholds)
- [ ] 4.2 Update profile-store actions: updateSportZones(profileId, sport, zoneType, zones)
- [ ] 4.3 Update profile-store actions: toggleZoneMode(profileId, sport, zoneType, mode)
- [ ] 4.4 Auto-recalculate zones when threshold changes (if mode is "auto")
- [ ] 4.5 Confirmation flow when switching from manual to auto
- [ ] 4.6 Update profile persistence to save sportZones
- [ ] 4.7 Test store actions: threshold update triggers zone recalculation
- [ ] 4.8 Test store actions: manual mode persists custom zones
- [ ] 4.9 Test store actions: mode toggle with confirmation

## 5. Zone Editor UI

- [ ] 5.1 Create `SportZoneTabs` component: 4 tabs (Cycling/Running/Swimming/Generic)
- [ ] 5.2 Create `ZoneTypeSection` component: auto/manual toggle + threshold input or editable table
- [ ] 5.3 Create `ThresholdInput` component: labeled number input with unit suffix
- [ ] 5.4 Create `ZoneTable` component: read-only (auto) or editable (manual) zone rows
- [ ] 5.5 Create `PaceInput` component: mm:ss format input for pace thresholds
- [ ] 5.6 Wire `SportZoneTabs` into Profile Manager edit view
- [ ] 5.7 Add confirmation dialog for manual → auto mode switch
- [ ] 5.8 Test zone editor: renders correct tabs per sport
- [ ] 5.9 Test zone editor: auto mode shows calculated zones
- [ ] 5.10 Test zone editor: manual mode shows editable table

## 6. AI Generator Zone Indicator

- [ ] 6.1 Create `ZoneIndicator` component: shows profile name + thresholds for selected sport
- [ ] 6.2 Handle no-profile state: show hint with link to Profile Manager
- [ ] 6.3 Handle no-zones-for-sport state: show "No {sport} zones configured"
- [ ] 6.4 Wire `ZoneIndicator` into `AiWorkoutForm` below sport selector
- [ ] 6.5 Test zone indicator: renders correct thresholds for selected sport
- [ ] 6.6 Test zone indicator: no-profile shows setup hint

## 7. zones-formatter Update

- [ ] 7.1 Update `formatZonesContext` to accept sport parameter
- [ ] 7.2 Format only the selected sport's zones (HR + power/pace as applicable)
- [ ] 7.3 Format pace zones in human-readable format (e.g., "Z2: 5:15-5:45/km")
- [ ] 7.4 Fallback: no sport selected → format all sports (backward compat)
- [ ] 7.5 Update `useAiGeneration` to pass selected sport to zones-formatter
- [ ] 7.6 Test formatter: cycling → power + HR zones only
- [ ] 7.7 Test formatter: running → pace + power + HR zones
- [ ] 7.8 Test formatter: swimming → pace + HR zones
- [ ] 7.9 Test formatter: pace zone formatting (both min/km and min/100m)

## 8. Default Zone Templates

- [ ] 8.1 Create default sport zone configs for new profiles (all sports with empty thresholds)
- [ ] 8.2 Update profile creation to initialize sportZones
- [ ] 8.3 Update `DEFAULT_POWER_ZONES` and `DEFAULT_HEART_RATE_ZONES` to be used within sportZones
- [ ] 8.4 Test new profile has correct sportZones structure

## 9. Documentation & CI

- [ ] 9.1 Update SPA README with sport zones feature
- [ ] 9.2 Add changeset
