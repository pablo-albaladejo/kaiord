# Sport-Specific Training Zones

Per-sport zone configuration with auto-calculated and manual modes.

## Requirements

### Requirement: Zone Types per Sport

Each sport SHALL support specific zone types:

| Sport | HR Zones | Power Zones (watts) | Pace Zones |
|---|---|---|---|
| Cycling | YES | YES | NO |
| Running | YES | YES | YES (min/km) |
| Swimming | YES | NO | YES (min/100m) |
| Generic | YES | NO | NO |

HR zones SHALL be available for ALL sports.

### Requirement: Thresholds per Sport

Each sport SHALL define its available thresholds:

| Sport | Thresholds |
|---|---|
| Cycling | LTHR (bpm), FTP (watts) |
| Running | LTHR (bpm), FTP run (watts), Threshold pace (min/km) |
| Swimming | LTHR (bpm), Threshold pace (min/100m) |
| Generic | LTHR (bpm) |

### Requirement: Auto-Calculated Zones

When a threshold is set, zones SHALL be auto-calculated using standard training zone formulas. The user MAY override by switching to manual mode.

HR zones SHALL be calculated from LTHR using Karvonen or percentage-based method (5 zones).
Power zones SHALL be calculated from FTP using Coggan's 7-zone model.
Pace zones SHALL be calculated from threshold pace (5-6 zones).

### Requirement: Manual Zone Entry

Users SHALL be able to define each zone's min/max values manually for any zone type. Manual mode SHALL override auto-calculated values. Switching from manual back to auto SHALL recalculate and replace manual values (with confirmation).

### Requirement: Profile Schema Migration

Existing profiles with top-level `powerZones` and `heartRateZones` SHALL be migrated automatically:
- `powerZones` → `sportZones.cycling.powerZones`
- `heartRateZones` → `sportZones.cycling.heartRateZones` AND `sportZones.generic.heartRateZones`
- `ftp` → `sportZones.cycling.thresholds.ftp`
- `maxHeartRate` → `sportZones.cycling.thresholds.lthr` (and copied to other sports)

Migration SHALL happen transparently on profile load.

### Requirement: Zone Editor UI

The Profile Manager SHALL include a zone editor with:
- Tab per sport (Cycling, Running, Swimming, Generic)
- Per zone type: toggle between Auto and Manual modes
- Auto mode: threshold input field → zones table (read-only, calculated)
- Manual mode: editable zones table with min/max per zone
- Visual feedback when switching between modes

### Requirement: Pace Zone Schema

A new `PaceZone` type SHALL be added:
```
PaceZone = {
  zone: number (1-6),
  name: string,
  minPace: number (seconds per km or seconds per 100m),
  maxPace: number (seconds per km or seconds per 100m),
  unit: "min_per_km" | "min_per_100m"
}
```

### Requirement: AI Generator Zone Indicator

The AI Generator component SHALL display:
- The active profile name
- Which sport's zones will be injected (based on the selected sport dropdown)
- A summary of the active thresholds (e.g., "FTP: 250W, LTHR: 170bpm")
- A link to the Profile Manager if no profile is active

### Requirement: Sport-Specific Zone Injection

The `zones-formatter` SHALL only inject zones matching the selected sport:
- Cycling → power zones + HR zones
- Running → pace zones + power zones + HR zones
- Swimming → pace zones + HR zones
- Generic → HR zones
- No sport selected → all zones from all sports (current behavior)

## Scenarios

#### Scenario: Configure cycling zones

- **GIVEN** a user opens Profile Manager and selects the Cycling tab
- **WHEN** they enter FTP = 250W
- **THEN** 7 power zones are auto-calculated using Coggan's model
- **AND** they see a read-only table: Z1 (0-137W), Z2 (138-187W), etc.

#### Scenario: Manual HR zones for running

- **GIVEN** a user is on the Running tab in zone editor
- **WHEN** they toggle HR zones to "Manual" mode
- **THEN** the zone table becomes editable
- **AND** they can set custom min/max bpm for each of the 5 zones

#### Scenario: Switch from manual to auto

- **GIVEN** a user has manually edited running HR zones
- **WHEN** they toggle back to "Auto"
- **THEN** a confirmation dialog appears: "This will replace your manual zones with calculated values"
- **AND** on confirm, zones are recalculated from the LTHR threshold

#### Scenario: Swimming pace zones

- **GIVEN** a user sets swimming threshold pace to 1:45/100m
- **WHEN** zones are auto-calculated
- **THEN** pace zones are in min/100m format
- **AND** the zones-formatter outputs "Pace zones: Z1: 2:10-2:30/100m, Z2: 1:55-2:10/100m, ..."

#### Scenario: AI Generator shows zone indicator

- **GIVEN** a user has profile "Pablo" active with cycling FTP=250W
- **WHEN** they select sport "Cycling" in the AI Generator
- **THEN** below the sport selector, text shows: "Using zones from Pablo: FTP 250W, LTHR 170bpm"

#### Scenario: No profile active

- **GIVEN** no profile is active
- **WHEN** the AI Generator renders
- **THEN** a hint shows: "Set up a profile with training zones for better results"
- **AND** a link opens the Profile Manager

#### Scenario: Migration of existing profile

- **GIVEN** a profile exists with top-level `powerZones` and `heartRateZones`
- **WHEN** the profile is loaded after the update
- **THEN** zones are migrated to `sportZones.cycling` and `sportZones.generic`
- **AND** the original top-level fields are removed
- **AND** the migration is persisted

#### Scenario: Generate running workout with pace zones

- **GIVEN** a user has running threshold pace = 5:00/km
- **AND** selects sport "Running" in the AI Generator
- **WHEN** they generate a workout mentioning "Z3 intervals"
- **THEN** the LLM receives pace zone context and generates steps with correct pace targets
