<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/application/coaching/`

## Purpose

Coaching-plan use cases: link/unlink a Train2Go account, convert a coaching activity into a KRD workout (manual or AI-assisted), expand a coaching day into its activities, push profile zones to Train2Go, and heal legacy SHORT-form `coachingActivityId` rows into the canonical COMPOSITE shape.

## Key Files

### Account + transport

- `link-account.ts`, `unlink-account.ts` — bind a profile to a Train2Go account.
- `coaching-transport-port.ts` / `.test.ts` — transport port consumed by use cases (implemented by `adapters/train2go`).

### Convert coaching activity → workout

- `convert-coaching-activity.ts` — entry point, dispatches manual vs AI.
- `convert-coaching-activity-manual.ts` / `.test.ts` + `*-helpers.ts` + `*-types.ts` — manual conversion (user-edited body).
- `convert-coaching-activity-with-ai.ts` + helpers/types/stubs/test-helpers + `.test.ts` — AI conversion with idempotency keying and error mapping.
- `convert-coaching-activity-with-ai-idempotency.ts` — same-input dedup.
- `convert-coaching-activity-error-mapper.ts` — translates AI errors into domain errors.
- `coaching-workout-builder.ts` — builds the KRD payload from the converted activity.
- `coaching-template.ts` / `.test.ts` — converts an activity into a library template instead of a workout.
- `ensure-session-match.ts` — idempotently creates the `sessionMatch` row tying the activity to its produced workout.
- `attempt-link.ts` + `attempt-link-helpers.ts` / `.test.ts` — opportunistic linking flow.

### Expand + match

- `expand-day.ts` / `.test.ts` — expand a coaching day into per-activity rows.
- `match-executed-workouts.ts` / `.test.ts` — match executed Garmin/FIT workouts against prescribed coaching activities (the Train2Go three-slot UI in `MatchedSessionCard`).

### Zones sync

- `sync-zones.ts` / `.test.ts` (+ `sync-zones.test-fixtures.ts`) — main orchestrator: pushes profile zones to Train2Go, respecting method-awareness.
- `sync-zones-method-aware.test.ts` — auto vs manual zone-method behavior.
- `sync-zones-bands.test.ts` — band-level write fan-out.
- `sync-zones-band-{fields,key,mappers,strategies,table-reconcile,writes}.ts` — per-band write strategies.
- `sync-zones-{helpers,hr-fallback,partition,payload-mapper,profile-fields,snapshot,snapshot-write,threshold-fields}.ts` — slicing the payload, fallbacks, snapshotting.
- `commit-conflict-{band-tables,resolution,table-apply}.ts` — conflict commit path.
- `zone-table-classifier.ts` / `.test.ts` + `-detectors.ts` / `-state-helpers.ts` / `-types.ts` — classifies zone tables for the sync strategy.

### Heal

- `heal-session-match-id-shape.ts` / `.test.ts` + `-helpers.ts` / `-types.ts` — migrates legacy SHORT-form (`"${source}:${sourceId}"`) `coachingActivityId` rows to the canonical COMPOSITE form (`"${profileId}:${source}:${sourceId}"`) in-place. Drives R-SessionMatchIdShape's healing path.

### Tests

- `use-cases.test.ts` — cross-cutting use-case wiring tests.
- `sync-week.ts` — orchestrates a whole-week scrape.

## For AI Agents

### Working In This Directory

1. **`coachingActivityId` is always COMPOSITE here.** Use `buildCoachingActivityId(profileId, source, sourceId)` for any new write. Never concatenate. The heal helpers exist to clean up legacy rows — they're not a license to write SHORT-form going forward.
2. **AI conversion is idempotency-keyed.** A repeat call with the same `(profileId, coachingActivityId, prompt-hash)` must reuse the prior result.
3. **Sync is transactional per-write.** Use `persistence.transaction(fn)` for multi-table commits in the band-write strategies.

### Testing Requirements

- One `.test.ts` per use case. The fan-out tests (`sync-zones-method-aware`, `sync-zones-bands`) cover the multi-strategy paths.
- The convert-with-AI suite uses `convert-coaching-activity-with-ai.test-stubs.ts` for AI provider stubs.

### Common Patterns

- Bigger flows split into `<name>.ts` + `<name>-helpers.ts` + `<name>-types.ts` + `<name>-test-stubs.ts` per the file-size cap.

## Dependencies

### Internal

- `../../ports/*` (especially `coaching-repositories`, `session-match-repository`, `auto-match-dismissal-repository`).
- `../../types/coaching-*`, `../../types/session-match`, `../../types/sport-zones`.
- `../../lib/raw-hash` (idempotency keys), `../../lib/profile-snapshot/*`.
- `@kaiord/ai`.

### External

- `zod` for input validation.

<!-- MANUAL: -->

This is the most-feature-dense use-case directory in the SPA. Healing is irreversible — every healing helper must be safe to rerun on already-healed rows.
