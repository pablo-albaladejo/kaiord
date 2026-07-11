<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/types/`

## Purpose

Domain types, Zod schemas, type guards, validators, and module-augmentation declarations local to the SPA. Re-exports core types from `@kaiord/core` so consumers can `import type { Workout, WorkoutStep } from "@/types"` without reaching across packages.

## Key Files

### KRD + UI types

- `krd.ts` / `.test.ts`, `krd-core.ts`, `krd-ui.ts`, `krd-guards.ts` / `.test.ts` — KRD core types and UI-augmented variants (UI variants add `id: ItemId` to every step / block).
- `ui-workout.ts` / `.test.ts` — `UIWorkout` (KRD + UI ids).
- `workout.ts` — workout-level type aliases.
- `workout-library.ts` — `WorkoutTemplate` shape.

### Calendar + scheduling

- `calendar.ts`, `calendar-enums.ts`, `calendar-fragments.ts`, `calendar-record.ts`, `calendar-schemas.ts` / `.test.ts` — `WorkoutRecord`, `WorkoutState`, and per-day calendar data.

### Profile + zones

- `profile.ts`, `profile-defaults.ts` — `Profile` shape + canonical defaults.
- `sport-zones.ts`, `sport-zones-schemas.ts`, `zone-schemas.ts` — sport-specific zone definitions and Zod schemas.
- `coaching-zones.ts`, `coaching-zones-schema.ts` — coaching-side zone shape.

### Coaching + session-match

- `coaching.ts`, `coaching-account.ts` / `.test.ts`, `coaching-source.ts` — Train2Go account + source typing.
- `coaching-activity.ts`, `coaching-activity-record.ts` / `.test.ts` — `CoachingActivityRecord` (composite id `${profileId}:${source}:${sourceId}`).
- `coaching-sync-state.ts` — `CoachingSyncStateRecord`.
- `session-match.ts` / `.test.ts`, `session-match-errors.ts` / `.test.ts` — `SessionMatch` + `SessionAlreadyMatchedError`.
- `auto-match-dismissal.ts` / `.test.ts` — `AutoMatchDismissal` (per `(profileId, weekStart)`).

### Sync + usage

- `sync.ts`, `bridge-schemas.ts` / `.test.ts` — bridge protocol shapes (`SyncState`, `ProfileSnapshot`, etc.).
- `usage-event-schemas.ts` / `.test.ts` — `UsageEventRecord` (append-only, synced per-run AI usage; the single usage-accounting store after the cutover).

### Settings

- `user-preferences.ts` / `.test.ts` — `UserPreferences` (per-profile calendar density, etc.).

### Validation

- `schemas.ts`, `validation.ts` / `.test.ts`, `validation-barrel.ts` — top-level validation entry points.
- `errors.ts` / `.test.ts`, `invalid-input-error.ts` — domain error types.

### Ambient

- `cf-beacon.d.ts` — Cloudflare Web Analytics global types.
- `chrome.d.ts` — `chrome.runtime` ambient types.

- `index.ts` — public export surface.
- `README.md` — type-module overview (historical; this AGENTS.md is the canonical map).

## Subdirectories

- `schemas/` — Zod schemas split out for size (`core-exports`, `form-schemas`, `repetition-block-id.test`, `ui-schemas`).
- `validation/` — validation helpers split out (`formatters`, `helpers`, `validate-helper`, `validation-types`, `validators`).

## For AI Agents

### Working In This Directory

1. **Domain schemas use snake_case; UI/form schemas use camelCase.** The mapping is intentional and pinned by tests.
2. **Branded ids.** `ItemId` (UI), `CoachingActivityRecord.id` (composite), `SessionMatch.id` — never substitute a bare string.
3. **Zod schemas live next to their TS types.** `.ts` for the inferred type + the Zod schema; `.test.ts` for round-trips.
4. **No runtime side effects.** Type/schema modules must not call into Dexie, fetch, etc.

### Testing Requirements

- Schema files have `.test.ts` round-trips: `safeParse({ valid }) → success`, `safeParse({ invalid }) → error path`.

### Common Patterns

- `<entity>.ts` (type + schema) + `<entity>.test.ts` (round-trip).

## Dependencies

### Internal

- `@kaiord/core` (re-exported KRD types and schemas).

### External

- `zod`.

<!-- MANUAL: -->

`types/` is the upstream end of every import in the SPA. Keep it dependency-free except for `zod` and `@kaiord/core` so it stays usable from `application/`.
