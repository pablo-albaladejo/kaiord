# Tasks: Profile Manager Redesign + Zone Methods

## 1. Zone Method Registry

- [ ] 1.1 Create `zone-methods.ts` with ZoneMethod type and registries
- [ ] 1.2 Define POWER_METHODS: Coggan 7-zone, Friel 7-zone, British Cycling 6-zone, Custom
- [ ] 1.3 Define HR_METHODS: Karvonen 5-zone, Friel 5-zone, Custom
- [ ] 1.4 Define PACE_METHODS: Daniels 5-zone, Custom
- [ ] 1.5 Each method: id, name, zoneCount, defaults (name, minPercent, maxPercent)
- [ ] 1.6 Update ZoneConfig type: replace `mode` with `method: string`
- [ ] 1.7 Test method registries: correct zone counts and percentage ranges

## 2. Zone Calculation with Real Units

- [ ] 2.1 Update `calculate-power-zones.ts` to accept method parameter and return watts
- [ ] 2.2 Update `calculate-hr-zones.ts` to accept method parameter and return bpm
- [ ] 2.3 Update `calculate-pace-zones.ts` to accept method parameter
- [ ] 2.4 Add helper: `calculateZoneValues(method, threshold)` → zones with real values
- [ ] 2.5 Test: Coggan zones with FTP=250 → Z1: 0-137W, Z2: 138-187W, etc.
- [ ] 2.6 Test: Friel zones with different percentages
- [ ] 2.7 Test: British Cycling 6-zone count

## 3. Profile Manager Layout Redesign

- [ ] 3.1 Remove "Edit Profile" card (ProfileForm blue box)
- [ ] 3.2 Add inline-editable profile name in dialog header
- [ ] 3.3 Add top-level tabs: "Training Zones" (default) | "Personal Data"
- [ ] 3.4 Move body weight to "Personal Data" tab
- [ ] 3.5 Remove FTP and Max HR from profile form (they live in sport thresholds)
- [ ] 3.6 Training Zones tab renders SportZoneTabs directly
- [ ] 3.7 Test: dialog renders with tabs, no edit profile card

## 4. Zone Method Dropdown

- [ ] 4.1 Create `ZoneMethodSelect` component: dropdown per zone type
- [ ] 4.2 Show available methods based on zone type (power/hr/pace)
- [ ] 4.3 On method change: recalculate zones from threshold using new method
- [ ] 4.4 Confirmation dialog when switching from a method with overrides
- [ ] 4.5 Test: method dropdown renders correct options per zone type

## 5. Editable Zone Table

- [ ] 5.1 Update `ZoneTable` to show real units (watts, bpm, min/km) as primary
- [ ] 5.2 Show percentages as secondary muted text
- [ ] 5.3 Make min/max cells editable (input on click/focus)
- [ ] 5.4 Mark overridden values visually (bold or accent color)
- [ ] 5.5 Make zone names inline-editable (text input styled as plain text)
- [ ] 5.6 Test: zone values show watts not percentages
- [ ] 5.7 Test: clicking a cell makes it editable
- [ ] 5.8 Test: overridden values are visually distinct

## 6. Custom Zone Count

- [ ] 6.1 Show "Add Zone" button when method is "Custom"
- [ ] 6.2 Show delete icon per zone row when method is "Custom"
- [ ] 6.3 Enforce limits: min 1, max 10 zones
- [ ] 6.4 New zones get default empty values and "Zone N" name
- [ ] 6.5 Test: add/remove zones in custom mode
- [ ] 6.6 Test: cannot remove last zone, cannot exceed 10

## 7. Store + Persistence Updates

- [ ] 7.1 Update profile store: method changes trigger zone recalculation
- [ ] 7.2 Update profile store: zone value/name overrides persist
- [ ] 7.3 Update profile store: custom zone add/remove
- [ ] 7.4 Migration: convert old `mode: "auto"|"manual"` to `method` field
- [ ] 7.5 Test: store actions with method changes
- [ ] 7.6 Test: migration from mode to method

## 8. Zones Formatter for LLM

- [ ] 8.1 Update formatter to output real values: "Z3 Tempo: 188-225W"
- [ ] 8.2 Include method name in output: "Power zones (Coggan 7-zone, FTP: 250W):"
- [ ] 8.3 Test: formatter outputs watts, bpm, pace in real units
- [ ] 8.4 Test: custom zone names appear in formatter output

## 9. Documentation & CI

- [ ] 9.1 Add changeset
