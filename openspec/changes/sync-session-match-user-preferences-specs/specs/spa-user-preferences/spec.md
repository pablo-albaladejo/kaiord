## ADDED Requirements

### Requirement: UserPreferences aggregate

A `UserPreferences` row SHALL exist at most once per `profileId` and SHALL be shaped:

```
{
  profileId: string,                            // owning profile, primary key
  calendarDensity: "compact" | "comfortable",   // calendar card density
  updatedAt: string                             // ISO timestamp
}
```

A `UserPreferences` row SHALL NOT be created at profile creation time. The row SHALL be created lazily on first user-driven mutation. Until then, reads SHALL return defaults computed at read time. The absence of a row is the canonical "no overrides" state.

#### Scenario: Profile creation does not pre-create preferences

- **WHEN** a new profile `P` is created
- **THEN** the `userPreferences` table contains no row for `P`; `getUserPreferences(P)` returns the default-derived value

#### Scenario: Lazy creation on first mutation

- **WHEN** the user toggles calendar density on profile `P` for the first time
- **THEN** a `userPreferences` row for `P` is upserted with `calendarDensity` set to the chosen value, `updatedAt` set to now

### Requirement: UserPreferencesRepository port

The infrastructure layer SHALL implement `UserPreferencesRepository` exposing `get`, `put` (upsert by `profileId`), and `delete` (idempotent; used by profile-delete cascade). The Dexie adapter SHALL register a cascade hook so deleting a `profiles` row deletes the corresponding `userPreferences` row (per `spa-session-match` cascade-table inventory which lists `userPreferences` under `profiles`).

#### Scenario: Get with no row returns undefined

- **WHEN** `get(P)` is called and no row exists for `P`
- **THEN** `undefined` is returned

#### Scenario: Cascade on profile delete

- **WHEN** profile `P` is deleted
- **THEN** the `userPreferences` row for `P` (if any) is deleted; subsequent `get(P)` returns `undefined`

### Requirement: getUserPreferences use case with default density derivation

The application SHALL expose `getUserPreferences({ profileId, defaultDensity? }, { repository, clock }): Promise<UserPreferences>` which reads the persisted row, returns it if found, or otherwise synthesises a default `{ profileId, calendarDensity: defaultDensity ?? "compact", updatedAt: clock() }` WITHOUT writing it. The derived default for `calendarDensity` is `compact` for viewport `>= 768px` and `comfortable` for `< 768px`. UI callers pass `defaultDensity` based on their viewport reading. Implementations MUST NOT call `Date.now()` directly inside the use case.

#### Scenario: Returns persisted preferences when row exists

- **WHEN** `getUserPreferences(P)` is called and a row exists with `calendarDensity: "comfortable"`
- **THEN** the persisted row is returned unchanged

#### Scenario: Returns derived default when no row exists (desktop)

- **WHEN** `getUserPreferences(P, { defaultDensity: "compact" })` is called and no row exists
- **THEN** the result has `calendarDensity: "compact"` and no row is written

#### Scenario: Returns derived default when no row exists (mobile)

- **WHEN** `getUserPreferences(P, { defaultDensity: "comfortable" })` is called and no row exists
- **THEN** the result has `calendarDensity: "comfortable"` and no row is written

### Requirement: setCalendarDensity use case

The application SHALL expose `setCalendarDensity({ profileId, density }, { clock, repository, profileRepository })` which reads `profileRepository.getById(profileId)` inside a `db.transaction('rw', [profiles, userPreferences], ...)`, throws `ProfileNotFoundError` if missing, otherwise upserts the row with `calendarDensity: density` and `updatedAt: clock()`. The use case is idempotent for the same density (writes occur but `calendarDensity` is unchanged; only `updatedAt` refreshes). The transactional read-then-write resolves the race with concurrent profile delete.

#### Scenario: First-time density change creates the row

- **WHEN** `setCalendarDensity({ profileId: P, density: "comfortable" })` is called with `clock: () => "2026-05-01T10:00:00Z"` and no row exists
- **THEN** a row is created with `calendarDensity: "comfortable"` and `updatedAt: "2026-05-01T10:00:00Z"`

#### Scenario: Subsequent change updates the row in place

- **WHEN** `setCalendarDensity({ profileId: P, density: "compact" })` is called and a row exists with `comfortable`
- **THEN** the row is updated; `calendarDensity` becomes `compact`; `updatedAt` is set to the injected clock value

#### Scenario: Idempotent same-value set

- **WHEN** `setCalendarDensity({ profileId: P, density: "compact" })` is called and the row already has `compact`
- **THEN** the upsert succeeds; `updatedAt` is refreshed; no error

#### Scenario: updatedAt uses injected clock

- **WHEN** the test injects `clock: () => "2026-04-01T00:00:00Z"`
- **THEN** the persisted row's `updatedAt` is exactly `"2026-04-01T00:00:00Z"`

#### Scenario: Concurrent profile delete during density write

- **WHEN** profile `P` is deleted concurrently
- **THEN** the use case either writes the row before the delete (cleaned up by the delete's cascade hook) or throws `ProfileNotFoundError` if the delete committed first; in no case is an orphan row left behind

### Requirement: Reactive preference reads via useLiveQuery

The SPA SHALL consume preferences via `useUserPreferences(profileId)` backed by `useLiveQuery` over the `userPreferences` table. The hook re-renders when the row for `profileId` changes (including initial creation), re-evaluates when `profileId` changes (profile switch), and applies the viewport-derived default when the row does not exist. The hook SHALL NOT cache across `profileId` changes.

#### Scenario: Preference change re-renders consumers

- **WHEN** the user toggles density and `setCalendarDensity` writes to Dexie
- **THEN** every component using `useUserPreferences` for the active profile re-renders with the new density

#### Scenario: Profile switch shows the switched-to profile's preference

- **WHEN** the user switches from profile A (`comfortable`) to profile B (no row, viewport `compact`)
- **THEN** the first render after the switch shows `compact`, never `comfortable`
