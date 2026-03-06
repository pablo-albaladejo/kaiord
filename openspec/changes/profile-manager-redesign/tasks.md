# Tasks: Profile Manager Redesign + Zone Methods

## 1. Zone Method Registry

- [x] 1.1 Create `zone-methods.ts` with ZoneMethod type and registries
- [x] 1.2 Define POWER_METHODS: Coggan 7-zone, Friel 7-zone, British Cycling 6-zone, Custom
- [x] 1.3 Define HR_METHODS: Karvonen 5-zone, Friel 5-zone, Custom
- [x] 1.4 Define PACE_METHODS: Daniels 5-zone, Custom
- [x] 1.5 Each method: id, name, zoneCount, defaults (name, minPercent, maxPercent)
- [x] 1.6 Update ZoneConfig type: replace `mode` with `method: string`
- [x] 1.7 Test method registries: correct zone counts and percentage ranges

## 2. Zone Calculation with Real Units

- [x] 2.1 Update `calculate-power-zones.ts` to accept method parameter and return watts
- [x] 2.2 Update `calculate-hr-zones.ts` to accept method parameter and return bpm
- [x] 2.3 Update `calculate-pace-zones.ts` to accept method parameter
- [x] 2.4 Add helper: `calculateZoneValues(method, threshold)` → zones with real values
- [x] 2.5 Test: Coggan zones with FTP=250 → Z1: 0-137W, Z2: 138-187W, etc.
- [x] 2.6 Test: Friel zones with different percentages
- [x] 2.7 Test: British Cycling 6-zone count

## 3. Profile Manager Layout Redesign

- [x] 3.1 Remove "Edit Profile" card (ProfileForm blue box)
- [x] 3.2 Add inline-editable profile name in dialog header
- [x] 3.3 Add top-level tabs: "Training Zones" (default) | "Personal Data"
- [x] 3.4 Move body weight to "Personal Data" tab
- [x] 3.5 Remove FTP and Max HR from profile form (they live in sport thresholds)
- [x] 3.6 Training Zones tab renders SportZoneTabs directly
- [x] 3.7 Test: dialog renders with tabs, no edit profile card

## 4. Zone Method Dropdown

- [x] 4.1 Create `ZoneMethodSelect` component: dropdown per zone type
- [x] 4.2 Show available methods based on zone type (power/hr/pace)
- [x] 4.3 On method change: recalculate zones from threshold using new method
- [x] 4.4 Confirmation dialog when switching from a method with overrides
- [x] 4.5 Test: method dropdown renders correct options per zone type

## 5. Editable Zone Table

- [x] 5.1 Update `ZoneTable` to show real units (watts, bpm, min/km) as primary
- [x] 5.2 Show percentages as secondary muted text
- [x] 5.3 Make min/max cells editable (input on click/focus)
- [x] 5.4 Mark overridden values visually (bold or accent color)
- [x] 5.5 Make zone names inline-editable (text input styled as plain text)
- [x] 5.6 Test: zone values show watts not percentages
- [x] 5.7 Test: clicking a cell makes it editable
- [x] 5.8 Test: overridden values are visually distinct

## 6. Custom Zone Count

- [x] 6.1 Show "Add Zone" button when method is "Custom"
- [x] 6.2 Show delete icon per zone row when method is "Custom"
- [x] 6.3 Enforce limits: min 1, max 10 zones
- [x] 6.4 New zones get default empty values and "Zone N" name
- [x] 6.5 Test: add/remove zones in custom mode
- [x] 6.6 Test: cannot remove last zone, cannot exceed 10

## 7. Store + Persistence Updates

- [x] 7.1 Update profile store: method changes trigger zone recalculation
- [x] 7.2 Update profile store: zone value/name overrides persist
- [x] 7.3 Update profile store: custom zone add/remove
- [x] 7.4 Migration: convert old `mode: "auto"|"manual"` to `method` field
- [x] 7.5 Test: store actions with method changes
- [x] 7.6 Test: migration from mode to method

## 8. Zones Formatter for LLM

- [x] 8.1 Update formatter to output real values: "Z3 Tempo: 188-225W"
- [x] 8.2 Include method name in output: "Power zones (Coggan 7-zone, FTP: 250W):"
- [x] 8.3 Test: formatter outputs watts, bpm, pace in real units
- [x] 8.4 Test: custom zone names appear in formatter output

## 9. Documentation & CI

- [x] 9.1 Add changeset
