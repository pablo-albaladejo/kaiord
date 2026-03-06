# Proposal: Sport-Specific Training Zones

## Problem

Training zones are currently global per profile — one set of power zones and one set of HR zones shared across all sports. Athletes train with different thresholds per sport (cycling FTP differs from running FTP, swimming uses pace thresholds). The AI Generator injects these global zones without considering which sport the user selected, leading to irrelevant zone data in prompts (e.g., power zones sent for a swimming workout).

There is also no visual indicator showing which zones are being injected into the AI Generator.

## Solution

Refactor the profile zone system to be sport-specific:

1. Each profile has zone configurations per sport (cycling, running, swimming, generic)
2. Each sport defines which zone types are available (HR, power, pace)
3. Each zone type supports two modes: auto-calculated from a threshold or manually defined
4. The AI Generator shows which profile/zones are active and injects only the zones matching the selected sport
5. Existing profiles are migrated: global power zones → cycling, global HR zones → all sports

## Affected Packages

| Package | Change |
|---|---|
| `@kaiord/workout-spa-editor` | Profile types, zone schemas, Profile Manager UI (tabs per sport, auto/manual toggle, zone editors), AI Generator zones indicator, zones-formatter per sport |
| `@kaiord/core` | No changes — Profile types live in the SPA |
| `@kaiord/ai` | No changes — receives zones as text context |

## Breaking Changes

**BREAKING** (SPA internal only, not published API): `Profile` type changes — `powerZones` and `heartRateZones` move from top-level to `sportZones[sport]`. Migration function handles the transition.

## Constraints

- Architecture layer: adapters (SPA UI + store)
- Referenced specs: `openspec/specs/krd-format/spec.md` (zone target types)
- Profile types are SPA-internal (not in `@kaiord/core`)
- localStorage migration required for existing profiles
- Zone auto-calculation formulas must match TrainingPeaks standards
