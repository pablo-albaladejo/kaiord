<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/application/profile/`

## Purpose

Profile use cases: CRUD on `Profile` rows, switching the active profile, and the cascade-delete that wipes every per-profile table when a profile is removed (Dexie v13).

## Key Files

- `create-profile.ts` / `.test.ts` — create with defaults.
- `update-profile.ts` / `.test.ts` — patch fields on an existing profile.
- `delete-profile.ts` / `.test.ts` — basic single-table delete.
- `delete-profile-with-cascade.ts` / `.test.ts` — cascade-on-delete: wipes workouts, coaching activities, session matches, auto-match dismissals, user preferences, coaching sync state in one `persistence.transaction(fn)`.
- `delete-profile.cascade.integration.test.ts` — end-to-end cascade integration test against `createInMemoryPersistence`.
- `get-active-profile.ts` / `.test.ts` — read the active profile id and resolve it to the row.
- `set-active-profile.ts` / `.test.ts` — change the active profile.
- `errors.ts` — profile domain errors.
- `test-fixtures.ts` — canonical profile inputs.

## Subdirectories

- `helpers/` — `profile-factory.ts`, `profile-updater.ts`, `profile-utils.ts`, `sport-zone-updater.ts`.
- `zones/` — sport-specific zone editing use cases (set-zone-method, update-sport-thresholds, update-sport-zones, add/remove custom zone).

## For AI Agents

### Working In This Directory

1. **The cascade is the contract.** Any new per-profile table MUST opt in via the Dexie `is-per-profile-table` predicate (index on `profileId`). The integration test pins this — adding a table without cascade hookup will fail the test.
2. **Active-profile changes invalidate snapshot pushes.** Consumers (e.g. `use-profile-snapshot-push`) handle the transition; here we just write the new active id.
3. **`linkedAccounts` is migrated lazily** via `backfillLinkedAccounts` (from `adapters/dexie/dexie-migrations.ts`) — don't reintroduce a separate migration here.

### Testing Requirements

- Cascade integration test runs every per-profile repo and asserts zero rows for that profile after delete.

## Dependencies

### Internal

- `../../ports/persistence-port` (`ProfileRepository`, `WorkoutRepository`, every per-profile repo).
- `../../types/profile`, `../../types/profile-defaults`, `../../types/sport-zones`.

### External

- `zod`.

<!-- MANUAL: -->

When in doubt: a profile delete must leave the database in a state indistinguishable from "this profile never existed." That's the test.
