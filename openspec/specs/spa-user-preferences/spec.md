> Synced: 2026-05-03 (sync-session-match-user-preferences-specs)

# spa-user-preferences Specification

## Purpose

Persists per-profile user-facing preferences for the SPA (calendar density today; future fields land here without migration). Reads are lazy and viewport-aware: no row is created at profile creation time, defaults are derived at read time, and a row materialises only on the first user-driven mutation. Reactive consumption via `useLiveQuery` keeps the UI in sync with concurrent mutations and profile switches.

## Requirements

### Requirement: UserPreferences aggregate

A `UserPreferences` row SHALL exist at most once per `profileId` and SHALL be shaped:

```
{
  profileId: string,                            // owning profile, primary key
  calendarDensity: "compact" | "comfortable",   // calendar card density
  updatedAt: string                             // ISO timestamp
}
```

Additional preference fields MAY be added in future changes; this spec covers only `calendarDensity` for v1. New fields SHALL be added with safe defaults so older rows remain readable without migration.

A `UserPreferences` row SHALL NOT be created at profile creation time. The row SHALL be created lazily on first user-driven mutation. Until then, reads SHALL return defaults computed at read time (see "getUserPreferences use case with default density derivation"); the absence of a row is the canonical "no overrides" state.

#### Scenario: Profile creation does not pre-create preferences

- **WHEN** a new profile `P` is created
- **THEN** the `userPreferences` table contains no row for `P`; `getUserPreferences(P)` returns the default-derived value

#### Scenario: Lazy creation on first mutation

- **WHEN** the user toggles calendar density on profile `P` for the first time
- **THEN** a `userPreferences` row for `P` is upserted with `calendarDensity` set to the chosen value, `updatedAt` set to now

### Requirement: UserPreferencesRepository port

The infrastructure layer SHALL implement `UserPreferencesRepository` exposing:

- `get(profileId): Promise<UserPreferences | undefined>` — returns the persisted row or `undefined` if none exists.
- `put(prefs: UserPreferences): Promise<void>` — upserts by `profileId`.
- `delete(profileId): Promise<void>` — no-op when the row does not exist (idempotent); used by profile-delete cascade.

The Dexie adapter SHALL register a cascade hook so deleting a `profiles` row deletes the corresponding `userPreferences` row (per `spa-session-match` "Cascade hooks on coaching-activity and workout deletion" cascade-table inventory, which lists `userPreferences` under `profiles`).

#### Scenario: Get with no row returns undefined

- **WHEN** `get(P)` is called and no row exists for `P`
- **THEN** `undefined` is returned (the application layer decides the default)

#### Scenario: Cascade on profile delete

- **WHEN** profile `P` is deleted
- **THEN** the `userPreferences` row for `P` (if any) is deleted; subsequent `get(P)` returns `undefined`

### Requirement: getUserPreferences use case with default density derivation

The application SHALL expose `getUserPreferences(input: { profileId: string, defaultDensity?: "compact" | "comfortable" }, deps: { repository: UserPreferencesRepository, clock: () => string }): Promise<UserPreferences>` which:

1. Reads `deps.repository.get(input.profileId)`.
2. If a row exists, returns it.
3. Otherwise, returns a synthesised default `{ profileId: input.profileId, calendarDensity: input.defaultDensity ?? "compact", updatedAt: deps.clock() }` WITHOUT writing it.

The derived default for `calendarDensity` SHALL be (computed by the caller, since the application layer is viewport-agnostic):

- `compact` when the viewport width is `>= 768px` (desktop / tablet landscape)
- `comfortable` when the viewport width is `< 768px` (mobile / tablet portrait)

UI callers SHALL pass `defaultDensity` based on their viewport reading. Both `repository` and `clock` are normative injected dependencies — implementations MUST NOT call `Date.now()` or instantiate the repository directly inside the use case.

#### Scenario: Returns persisted preferences when row exists

- **WHEN** `getUserPreferences(P)` is called and a row exists for `P` with `calendarDensity: "comfortable"`
- **THEN** the persisted row is returned unchanged

#### Scenario: Returns derived default when no row exists (desktop)

- **WHEN** `getUserPreferences(P, { defaultDensity: "compact" })` is called and no row exists
- **THEN** the result has `calendarDensity: "compact"` and no row is written to Dexie

#### Scenario: Returns derived default when no row exists (mobile)

- **WHEN** `getUserPreferences(P, { defaultDensity: "comfortable" })` is called and no row exists
- **THEN** the result has `calendarDensity: "comfortable"` and no row is written to Dexie

### Requirement: setCalendarDensity use case

The application SHALL expose `setCalendarDensity({ profileId, density }, deps: { clock: () => string, repository: UserPreferencesRepository, profileRepository: ProfileRepository })` which:

1. Reads `profileRepository.getById(profileId)` inside a `db.transaction('rw', [profiles, userPreferences], ...)`. If the profile does not exist (concurrent delete), the use case SHALL throw `ProfileNotFoundError` and write nothing.
2. Otherwise, upserts the `UserPreferences` row for `profileId` with `calendarDensity: density` and `updatedAt: clock()`.

The use case SHALL be idempotent for the same density value (writes still occur, but `calendarDensity` is unchanged; only `updatedAt` is refreshed). The injected `clock` ensures `updatedAt` is deterministic in tests — implementations MUST NOT call `Date.now()` or `new Date().toISOString()` directly.

The transactional read-then-write resolves the race between density write and concurrent profile delete: either the write commits before the delete (and the cascade hook on profile delete cleans up the row), or the delete commits first and the density write throws `ProfileNotFoundError` without producing an orphan.

#### Scenario: First-time density change creates the row

- **WHEN** `setCalendarDensity({ profileId: P, density: "comfortable" })` is called with `clock: () => "2026-05-01T10:00:00Z"` and no row exists for `P`
- **THEN** a row is created with `calendarDensity: "comfortable"` and `updatedAt: "2026-05-01T10:00:00Z"`

#### Scenario: Subsequent change updates the row in place

- **WHEN** `setCalendarDensity({ profileId: P, density: "compact" })` is called and a row exists for `P` with `comfortable`
- **THEN** the row is updated in place; `calendarDensity` becomes `compact`; `updatedAt` is set to the injected clock value

#### Scenario: Idempotent same-value set

- **WHEN** `setCalendarDensity({ profileId: P, density: "compact" })` is called and the row already has `compact`
- **THEN** the upsert succeeds; `updatedAt` is refreshed to the injected clock value; no error

#### Scenario: updatedAt uses injected clock

- **WHEN** the test injects `clock: () => "2026-04-01T00:00:00Z"` and invokes `setCalendarDensity`
- **THEN** the persisted row's `updatedAt` is exactly `"2026-04-01T00:00:00Z"` (no real-time leakage)

#### Scenario: Concurrent profile delete during density write

- **WHEN** profile `P` is deleted concurrently and `setCalendarDensity({ profileId: P, ... })` runs the transactional read-then-write
- **THEN** the use case either writes the row before the delete (and the delete's cascade hook cleans it up) or throws `ProfileNotFoundError` if the delete committed first; in no case is an orphan `userPreferences` row left behind

### Requirement: Reactive preference reads via useLiveQuery

The SPA SHALL consume preferences via a `useUserPreferences(profileId)` hook backed by `useLiveQuery` over the `userPreferences` table. The hook SHALL:

- Re-render its consumers when the `userPreferences` row for `profileId` changes (including initial creation).
- Re-evaluate when `profileId` changes (profile switch).
- Apply the viewport-derived default when the row does not exist.

The hook SHALL NOT cache across `profileId` changes — switching from profile A (with `comfortable`) to profile B (with no row) SHALL render B's derived default on the first render after the switch, never A's value.

#### Scenario: Preference change re-renders consumers

- **WHEN** the user toggles density and `setCalendarDensity` writes to Dexie
- **THEN** every component using `useUserPreferences` for the active profile re-renders with the new density

#### Scenario: Profile switch shows the switched-to profile's preference

- **WHEN** the user switches from profile A (`comfortable`) to profile B (no row, viewport `compact`)
- **THEN** the first render after the switch shows `compact`, never `comfortable`
