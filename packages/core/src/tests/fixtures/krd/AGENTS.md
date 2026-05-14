<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# krd

## Purpose

Rosie factory builders for the KRD envelope and its child collections. Each builder is generic-typed against the domain type (`Factory<KRD>`, `Factory<KRDLap>`, etc.) so a Zod schema change breaks the factory at compile time. Re-exported via `@kaiord/core/test-utils` (see `../../test-utils/index.ts`).

## Key Files

| File                   | Description                                                                                                                                                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `krd.fixtures.ts`      | `buildKRD: Factory<KRD>` — full envelope with `version:"1.0"`, random type, generated metadata/sessions/laps/records/events, plus a stub `extensions.fit.developerFields: []`.                                                                                                                |
| `metadata.fixtures.ts` | `buildKRDMetadata: Factory<KRDMetadata>` — picks manufacturer from `[garmin,wahoo,polar,suunto]`, product from `[fenix7,edge530,forerunner945,elemnt]`, sport from `[running,cycling,swimming]`, subSport from `[trail,road,track,indoor]`. Numeric serial uses `FAKER_SERIAL_NUMBER_DIGITS`. |
| `session.fixtures.ts`  | `buildKRDSession: Factory<KRDSession>` — random startTime, totalElapsedTime (60-7200s), totalDistance (1000-50000m), sport+subSport, HR avg/max (60-220), cadence avg, power avg, totalCalories.                                                                                              |
| `lap.fixtures.ts`      | `buildKRDLap: Factory<KRDLap>` — same shape pattern but smaller ranges (lap-scale: elapsed 30-1800s, distance 100-10000m).                                                                                                                                                                    |
| `record.fixtures.ts`   | `buildKRDRecord: Factory<KRDRecord>` — single time-series sample with random lat/lon via `faker.location`, altitude 0-3000m, HR 60-200, cadence 60-120, power 0-500, float speed 0-15.                                                                                                        |
| `event.fixtures.ts`    | `buildKRDEvent: Factory<KRDEvent>` — picks `eventType` from `[event_start,event_stop,event_pause,event_resume,event_lap,event_marker,event_timer]` (subset of the schema's 10 values — does NOT exercise workout_step_change/session_start/activity_start).                                   |

## For AI Agents

### Working In This Directory

- `buildKRD` builds a one-session/two-lap/three-record/one-event sample. If you need a multi-session envelope, override `.attr("sessions", () => ...)` at the call site.
- The `event.fixtures.ts` enum subset is intentional — tests that need `event_workout_step_change` build the event by hand because that event also requires a `data` field referencing a step index.
- `buildKRDMetadata` is the package-aware metadata builder. The looser `../metadata.fixtures.ts` is for non-KRD envelope tests (e.g., raw schema validation).
- Cross-imports from `../../../test-utils/tolerance-constants` ARE allowed even though test-utils is a public subpath — these factories are themselves re-exported through test-utils, so the import direction is internal.

<!-- MANUAL: -->
