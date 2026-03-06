# Profile Manager Redesign + Zone Methods

## Requirements

### Requirement: Profile Manager Layout

The Profile Manager dialog SHALL have this structure:
- Profile name: inline-editable in the dialog header
- Two top-level tabs: "Training Zones" (default) and "Personal Data"
- Training Zones tab: sub-tabs per sport (Cycling/Running/Swimming/Generic)
- Personal Data tab: body weight, age, and future fields
- No separate "Edit Profile" form card

### Requirement: Zone Methods

Each zone type SHALL offer a dropdown of predefined zone methods:

**Power zones:**
- Coggan 7-zone (default)
- Friel 7-zone
- British Cycling 6-zone
- Custom

**Heart rate zones:**
- Karvonen 5-zone (default)
- Friel 5-zone
- Custom

**Pace zones:**
- Daniels 5-zone (default)
- Custom

Selecting a method SHALL set the number of zones, default percentages, and zone names. The method dropdown replaces the Auto/Manual toggle.

### Requirement: Zone Values in Real Units

Zone tables SHALL display values in real units:
- Power zones: watts (e.g., "Z3: 190-225W")
- HR zones: bpm (e.g., "Z2: 139-151 bpm")
- Pace zones: min/km or min/100m (e.g., "Z3: 4:30-5:00/km")

Percentages MAY be shown as secondary info (e.g., "(76-90%)") but real values MUST be primary.

### Requirement: Editable Zone Values

When a predefined method is selected, zone values SHALL be auto-calculated from thresholds but the user MAY override any individual zone's min/max values. Overridden values SHALL be visually distinguished (e.g., bold or different color).

When "Custom" method is selected, all values MUST be manually entered.

### Requirement: Editable Zone Names

Zone names SHALL be editable inline. Each zone row SHALL allow the user to click the name and type a custom replacement. Custom names SHALL persist across sessions.

### Requirement: Custom Zone Count

When "Custom" method is selected, the user SHALL be able to:
- Add zones (button below the table, up to 10)
- Remove zones (delete button per row, minimum 1)

Predefined methods have a fixed zone count that cannot be changed.

### Requirement: Zone Method Schema

The `ZoneConfig` type SHALL include a `method` field:
```
ZoneConfig<T> = {
  method: string;    // e.g., "coggan-7", "friel-7", "custom"
  zones: Array<T>;
  overrides?: Record<number, Partial<T>>;  // per-zone value overrides
}
```

### Requirement: LLM Prompt Zone Format

The zones-formatter SHALL output zone values in real units for the LLM prompt:
```
Power zones (Coggan 7-zone, FTP: 250W):
  Z1 Active Recovery: 0-137W
  Z2 Endurance: 138-187W
  Z3 Tempo: 188-225W
  ...
```

Not percentages. The LLM needs absolute values to generate correct targets.

## Scenarios

#### Scenario: Select Coggan 7-zone power method

- **GIVEN** a user opens Cycling tab with FTP=250W
- **WHEN** they select "Coggan 7-zone" from the power zones dropdown
- **THEN** 7 zones appear with calculated watt values (Z1: 0-137W, Z2: 138-187W, etc.)
- **AND** zone names match Coggan names (Active Recovery, Endurance, Tempo, etc.)

#### Scenario: Override a single zone value

- **GIVEN** a user has Coggan 7-zone power zones auto-calculated
- **WHEN** they click on Z3 max value and change from 225W to 230W
- **THEN** the value updates to 230W
- **AND** the cell is visually marked as overridden
- **AND** other zones remain auto-calculated

#### Scenario: Rename a zone

- **GIVEN** a user has Friel 5-zone HR zones
- **WHEN** they click on "Zone 2" name and type "Easy Aerobic"
- **THEN** the name changes to "Easy Aerobic" and persists

#### Scenario: Custom method with variable zone count

- **GIVEN** a user selects "Custom" power zone method
- **WHEN** they click "Add Zone" twice (starting from 0)
- **THEN** 2 empty zone rows appear with editable min/max/name
- **AND** they can add up to 10 total
- **AND** they can remove any zone (minimum 1)

#### Scenario: Switch method resets zones

- **GIVEN** a user has customized Coggan zones with overrides
- **WHEN** they switch to "Friel 7-zone"
- **THEN** a confirmation dialog appears: "This will replace your current zones"
- **AND** on confirm, zones reset to Friel defaults

#### Scenario: LLM receives real zone values

- **GIVEN** a user has cycling FTP=250W with Coggan zones
- **WHEN** they generate a workout mentioning "Z3 intervals"
- **THEN** the LLM prompt contains "Z3 Tempo: 188-225W" (not percentages)

#### Scenario: Profile Manager without Edit Profile card

- **GIVEN** a user opens Profile Manager
- **WHEN** they view a profile
- **THEN** they see the profile name in the header (editable)
- **AND** Training Zones tab is selected by default
- **AND** there is no separate "Edit Profile" form with FTP/Max HR fields
