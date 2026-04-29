## ADDED Requirements

### Requirement: Persisted-entity reactive read pattern

Components in `@kaiord/workout-spa-editor` reading any persisted entity stored in the Dexie database (workouts, templates, profiles, AI providers, sync state, monthly usage, coachingActivities, coachingSyncState, and the `meta` table) SHALL obtain that data from a reactive query against Dexie — either inline via `useLiveQuery` (from `dexie-react-hooks`) or via a thin wrapping hook that uses it (such as `useActiveProfileLive`, `useLibraryTemplatesLive`, `useAiProvidersLive`). Components SHALL NOT read these entities from a Zustand store mirror.

The reactive contract guarantees that any write to a Dexie table — including writes from application use cases that bypass Zustand entirely (such as `linkAccount` introduced by `train2go-profile-link`) — propagates to every consuming component on the next render without manual re-fetch or mirror synchronization. Hooks that compose multiple Dexie reads (such as `useActiveProfileLive`, which joins the `meta` table's `activeProfileId` with the `profiles` table) SHALL perform the join inside a single `useLiveQuery` callback so consumers in the same tab never observe an intermediate state where the active id references a profile that has not yet been observed. Cross-tab atomicity is not guaranteed by this requirement.

While the underlying query is loading on first mount, `useLiveQuery` returns `undefined`. Consumers SHALL treat `undefined` as the loading state (rendering an explicit fallback such as a skeleton or "Loading…" message) and SHALL NOT confuse it with the empty-data state (an empty array, `null`, or empty string). Live hooks reading `meta`-table values SHALL return `null` (not `""`) for the missing-row case so consumers can distinguish loading (`undefined`), missing (`null`), and empty (`""`).

#### Scenario: Connect Train2Go updates the calendar header in real time

- **WHEN** the user clicks "Connect Train2Go" in Profile Settings, the `linkAccount` use case persists the link via `PersistencePort.profiles.put`, and the toast confirming success fires after the use case's promise resolves
- **THEN** the calendar header's per-source Sync button SHALL appear without a manual remount or page refresh — the test verifies via `waitFor` against the rendered button

#### Scenario: Profiles, templates, and AI providers survive a page refresh

- **WHEN** the user refreshes the SPA after creating a profile, saving a template, and configuring an AI provider in the previous session
- **THEN** all three SHALL become visible in their respective UI surfaces (Profile Manager dialog, library badge and dialog, AI settings) after the initial loading state resolves, without the user being asked to recreate them; loading states use `useLiveQuery`'s `undefined` return value to render skeletons or "Loading…" messages until the data resolves

#### Scenario: Active profile join is observed atomically within a single tab

- **WHEN** the active profile changes from `A` to `B` via the `setActiveProfile` use case (which writes the `meta.activeProfileId` row) followed by an unrelated mutation to the `profiles` table within the same tab, with both observations propagated by `useLiveQuery`
- **THEN** every same-tab consumer of `useActiveProfileLive()` SHALL observe a single transition from `{id: "A", profile: ProfileA}` directly to `{id: "B", profile: ProfileB}` — never `{id: "B", profile: null}` or `{id: "B", profile: ProfileA}` as an intermediate render

### Requirement: No Zustand-to-Dexie write-through

Among the Zustand stores in `@kaiord/workout-spa-editor`, only `useWorkoutStore` SHALL write to Dexie, and only on explicit user actions (Save to Library, Push to Garmin). All other Zustand stores in the package SHALL hold runtime-only state and SHALL NOT import from `adapters/dexie/dexie-database`, SHALL NOT import any helper named `persistState`, and SHALL NOT call `persistence.<repo>.put(...)` (or any equivalent persistence-write entry point) from within a store action. Persistence writes for profiles, library templates, AI providers, and any other persisted entity SHALL go through application-layer use cases that take a `PersistencePort` (or a specific repository from the port) as a dependency; components SHALL invoke those use cases directly via the `PersistenceProvider` context.

When a use case's persistence write rejects (e.g., Dexie quota exceeded, IDB transaction abort, encryption failure), the calling component SHALL surface a user-visible error indication (toast, inline banner, or equivalent) and SHALL NOT silently move to a stale-success state. Use cases SHALL propagate Dexie rejections (not swallow them with `.catch(console.error)`).

A static guard test under `scripts/check-no-zustand-writethrough.mjs` (executed in CI via `pnpm test:scripts`) SHALL enforce this rule by parsing imports of every file under `packages/workout-spa-editor/src/store/**` and failing the build if any non-allowlisted file imports `dexie-database` (rule R-DexieImport) or a `persistState` helper (rule R-PersistStateImport). The same script SHALL also scan every file under `packages/workout-spa-editor/src/application/**` and fail (rule R-AppDexieImport) if ANY file imports `dexie-database` directly — application code MUST access persistence via `PersistencePort` only, with no allowlist.

#### Scenario: Mechanical guard catches a `dexie-database` import in a non-allowlisted store

- **WHEN** a contributor adds a Zustand store under `packages/workout-spa-editor/src/store/**` whose source imports `../adapters/dexie/dexie-database` (or any path resolving to it — relative, alias, or barrel re-export), and the file is not on the allowlist
- **THEN** `pnpm test:scripts` SHALL fail in CI with rule R-DexieImport, naming the offending file and the offending import path, blocking the merge

#### Scenario: Mechanical guard catches a `persistState` import in a non-allowlisted store

- **WHEN** a contributor adds a Zustand store under `packages/workout-spa-editor/src/store/**` whose source imports a sibling identifier named `persistState`, and the file is not on the allowlist
- **THEN** `pnpm test:scripts` SHALL fail in CI with rule R-PersistStateImport, naming the offending file and the offending import, blocking the merge

#### Scenario: Allowlisted explicit-user-action write succeeds

- **WHEN** `useWorkoutStore`'s "Save to Library" action calls into a write helper that imports `dexie-database` (an allowlisted file path)
- **THEN** the static guard SHALL accept the import and pass

#### Scenario: Use case rejection surfaces as a user-visible error

- **WHEN** a component invokes an application use case (e.g., `await createProfile(persistence, name)`) and the underlying persistence write rejects (Dexie quota exceeded, simulated by injecting a rejecting `persistence.profiles.put` in a test)
- **THEN** the calling component SHALL render a user-visible error indication (toast or inline banner) AND SHALL NOT update the UI to a state implying success (no new profile in the live-query result, no navigation, no "saved" state flag)

#### Scenario: Reactive propagation across stores after a write through `PersistencePort`

- **WHEN** any application use case writes to a persisted entity via `persistence.<repo>.put(...)` (or the equivalent setter), with no Zustand involvement
- **THEN** every consumer reading via the corresponding live hook SHALL re-render with the new data without a manual remount, refresh, or re-subscribe — tests verify via `waitFor` against the live-hook return value

### Requirement: Persistence transactions for multi-write use cases

Application use cases that perform two or more writes whose partial application would leave the persisted state inconsistent (e.g., `createProfile` conditionally writing both a `profiles` row AND `meta.activeProfileId` on the first profile; `deleteProfile` deleting a `profiles` row AND clearing `meta.activeProfileId` if it matched) SHALL wrap their writes in `await persistence.transaction(async () => { ... })`. The Dexie adapter SHALL implement this by delegating to `db.transaction("rw", db.tables, fn)`. The in-memory adapter SHALL implement this with snapshot/revert semantics: capture all repo state before invoking `fn`, restore on rejection, fire any subscribed listeners only on successful commit. Application code SHALL NOT import `db` (or any path resolving to `dexie-database`) directly to obtain transactions; the broader rule that no application file imports Dexie is enforced by the same R-AppDexieImport static guard documented under "No Zustand-to-Dexie write-through".

#### Scenario: Multi-write use case rolls back on partial failure

- **WHEN** a use case (e.g., `createProfile`) wraps two writes in `await persistence.transaction(async () => { await persistence.profiles.put(profile); await persistence.profiles.setActiveId(profile.id); })` and the second write rejects (simulated by injecting a rejecting `setActiveId` in a test)
- **THEN** the persisted state SHALL contain neither the new profile (the first write is rolled back) nor the new active-id, AND the use case promise SHALL reject so the calling component surfaces a user-visible error indication

#### Scenario: Application use case does not import Dexie directly (mechanically enforced)

- **WHEN** a contributor adds a file under `packages/workout-spa-editor/src/application/**` whose source imports `../adapters/dexie/dexie-database` (or any path resolving to it)
- **THEN** `pnpm test:scripts` SHALL fail in CI with rule R-AppDexieImport, naming the offending file and the offending import path, blocking the merge — application code accesses persistence via `PersistencePort` only

## MODIFIED Requirements

### Requirement: PersistencePort interface

The system SHALL define a PersistencePort interface with repository types for workouts, templates, profiles, AI providers, sync state, and usage tracking. Stores and use cases SHALL depend on the port interface, never on Dexie directly.

The port SHALL also expose `transaction<T>(fn: () => Promise<T>): Promise<T>` for multi-write atomicity. Application use cases that perform two or more writes whose partial application would leave the persisted state inconsistent SHALL invoke this method and pass an async callback containing the writes; adapters guarantee atomic commit-or-rollback (the Dexie adapter via `db.transaction("rw", ...)`; the in-memory adapter via snapshot/revert).

#### Scenario: Store uses PersistencePort

- **WHEN** any application code needs to read or write persisted data
- **THEN** it SHALL call methods on PersistencePort repositories, not Dexie tables directly

#### Scenario: Multi-write use case uses port transaction

- **WHEN** an application use case performs two or more writes that must commit atomically (e.g., creating a profile and setting it active when no profile previously existed)
- **THEN** it SHALL wrap the writes in `await persistence.transaction(async () => { ... })` rather than calling individual repository methods sequentially

### Requirement: Workout-store persistence boundary

The workout-store (Zustand) SHALL persist to Dexie only on explicit user actions (save to library, push to Garmin), never via automatic write-through. The workout-store is editor runtime state, not persisted data.

See also: the "No Zustand-to-Dexie write-through" requirement, which generalises the rule to all Zustand stores in `@kaiord/workout-spa-editor` and adds the static-guard enforcement.

#### Scenario: User edits a workout in the editor

- **WHEN** the user modifies steps, reorders, or uses undo/redo in the editor
- **THEN** changes SHALL remain in Zustand in-memory state only, with no Dexie writes

#### Scenario: User saves workout to library

- **WHEN** the user clicks "Save to Library" from the editor
- **THEN** the system SHALL write the current KRD to the templates table via `TemplateRepository`
