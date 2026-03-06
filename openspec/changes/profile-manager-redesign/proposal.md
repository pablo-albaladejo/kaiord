# Proposal: Profile Manager Redesign + Zone Methods

## Problem

1. **Redundant Edit Profile form** — The blue "Edit Profile" card shows Name, Body Weight, FTP, Max HR, duplicating data that already exists as thresholds in Training Zones.
2. **Power zones show % instead of watts** — With FTP=250, users see "0-55%" instead of "0-137W".
3. **Manual mode is not editable** — Toggling to Manual doesn't let users type custom values.
4. **Fixed zone count** — Hardcoded 7 power zones and 5 HR zones. No way to add/remove zones.
5. **No zone methods** — TrainingPeaks offers predefined zone systems (Coggan, Friel, etc.) with different zone counts and percentages.
6. **Zone names not editable** — Can't rename "Active Recovery" to a custom name.

## Solution

1. Redesign Profile Manager layout: remove Edit Profile form, use tabs (Training Zones / Personal Data), inline-editable profile name.
2. Add zone method dropdown per zone type (Coggan 7-zone, Friel, Daniels, Custom, etc.).
3. Show zone values in real units (watts, bpm, min/km) not percentages.
4. Make zones fully editable: values, names, and count (via Custom method or overrides).
5. Update zones-formatter to output real values to the LLM prompt.

## Affected Packages

| Package                      | Change                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `@kaiord/workout-spa-editor` | Profile Manager UI redesign, zone method system, editable zones, formatter update |

## Breaking Changes

None externally. Internal Profile type changes are backward-compatible (zone methods are additive).

## Constraints

- Architecture layer: adapters (SPA UI + store)
- Referenced specs: `openspec/specs/adapter-contracts/spec.md`
