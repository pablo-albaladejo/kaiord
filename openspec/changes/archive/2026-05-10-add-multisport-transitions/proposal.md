> Completed: 2026-05-10

## Why

Garmin Connect multisport workouts (triathlon-style or brick sessions with run/bike/run alternation) are currently unsupported end-to-end in Kaiord. The `@kaiord/garmin` adapter has `multi_sport` (sportTypeId 10) declared in its sport-type schema, but the workout INPUT schema lacks the `isSessionTransitionEnabled` flag required to enable automatic transitions between segments of different sports. As a result, multisport workouts generated through Kaiord either lose the transition flag or rely on undocumented implicit behavior. Empirical testing also revealed Garmin's server silently restructures multisport workouts that violate undocumented composition rules — knowledge that exists nowhere in the repo today, causing both the `generate-gcn` skill and the `@kaiord/garmin` writer to produce malformed multisport JSON.

## What Changes

- Add `isSessionTransitionEnabled: boolean | undefined` to the `garminWorkoutInputSchema` so the kaiord pipeline can propagate the flag from KRD to Garmin Connect.
- Document Garmin's empirical multisport segment composition rules in `packages/garmin/docs/MULTISPORT-TRANSITIONS.md` (composition constraints, target value ordering, global stepOrder, transition behavior).
- Update `.claude/skills/generate-gcn/reference.md` with a complete multisport example and a new "Multisport Rules" section so future skill invocations produce valid GCN at the first attempt.
- Update `.claude/skills/generate-gcn/SKILL.md` Sport Type table to include `multi_sport` (id 10) and add detection guidance for brick / triathlon / duathlon descriptions.
- Update `packages/garmin/docs/INPUT-VS-OUTPUT.md` to clarify that `isSessionTransitionEnabled` is bidirectional (input-accepted), not output-only.
- Update the existing GCN multisport fixture (`test-fixtures/gcn/WorkoutMultisportTriathlonInput.gcn`) to include `isSessionTransitionEnabled: true` and add a new alternating-brick fixture covering the run/bike alternation pattern.
- Add adapter-contracts requirements so any future Garmin reader/writer must preserve the transition flag and respect segment composition rules in round-trip.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `adapter-contracts`: add requirements that the Garmin GCN adapter must accept and round-trip `isSessionTransitionEnabled` when present, must respect Garmin's segment composition rules when writing multisport, and must use the `targetValueOne > targetValueTwo` ordering for pace and power targets.

## Impact

- **Code**: `packages/garmin/src/adapters/schemas/input/workout-input.schema.ts` (new optional field), GCN writer/converter that emits the field, GCN reader/converter that ingests it.
- **Tests**: round-trip tests for multisport fixtures must validate the transition flag survives. New fixture for alternating brick pattern.
- **Docs**: `packages/garmin/docs/MULTISPORT-TRANSITIONS.md` (new), `packages/garmin/docs/INPUT-VS-OUTPUT.md` (clarification), `packages/garmin/docs/API-FINDINGS.md` (cross-link).
- **Skill**: `.claude/skills/generate-gcn/SKILL.md` and `.claude/skills/generate-gcn/reference.md`.
- **No KRD change**: the canonical KRD format is not modified by this proposal. Multisport semantics in KRD are out of scope here; this change is limited to making the existing Garmin adapter round-trip multisport correctly.
- **No breaking change**: `isSessionTransitionEnabled` is added as optional, defaulting to absent. Existing single-sport workouts are unaffected.
