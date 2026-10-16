## MODIFIED Requirements

### Requirement: Persisted-entity reactive read pattern

Components in `@kaiord/workout-spa-editor` reading any persisted entity stored in the Dexie database (workouts, templates, profiles, AI providers, sync state, monthly usage, coachingActivities, coachingSyncState, the `meta` table, and the six health stores `healthSleep`, `healthWeight`, `healthHrv`, `healthDaily`, `healthBodyComposition`, `healthStress`) SHALL obtain that data from a reactive query against Dexie — either inline via `useLiveQuery` (from `dexie-react-hooks`) or via a thin wrapping hook that uses it (such as `useActiveProfileLive`, `useLibraryTemplatesLive`, `useAiProvidersLive`, `useHealthSleepWeekLive`). Components SHALL NOT read these entities from a Zustand store mirror.

The reactive contract guarantees that any write to a Dexie table — including writes from application use cases that bypass Zustand entirely (such as `linkAccount` introduced by `train2go-profile-link`, or the new `importHealthFitFile` introduced by this change) — propagates to every consuming component on the next render without manual re-fetch or mirror synchronization. Hooks that compose multiple Dexie reads (such as `useActiveProfileLive`, which joins the `meta` table's `activeProfileId` with the `profiles` table) SHALL perform the join inside a single `useLiveQuery` callback so consumers in the same tab never observe an intermediate state where the active id references a profile that has not yet been observed. Cross-tab atomicity is not guaranteed by this requirement.

While the underlying query is loading on first mount, `useLiveQuery` returns `undefined`. Consumers SHALL treat `undefined` as the loading state (rendering an explicit fallback such as a skeleton or "Loading…" message) and SHALL NOT confuse it with the empty-data state (an empty array, `null`, or empty string). Live hooks reading `meta`-table values SHALL return `null` (not `""`) for the missing-row case so consumers can distinguish loading (`undefined`), missing (`null`), and empty (`""`).

#### Scenario: Connect Train2Go updates the calendar header in real time

- **WHEN** the user links Train2Go from its card on the Connections page, the `linkAccount` use case persists the link via `PersistencePort.profiles.put`, and the toast confirming success fires after the use case's promise resolves
- **THEN** the calendar header's per-source Sync button SHALL appear without a manual remount or page refresh — the test verifies via `waitFor` against the rendered button

#### Scenario: Profiles, templates, and AI providers survive a page refresh

- **WHEN** the user refreshes the SPA after creating a profile, saving a template, and configuring an AI provider in the previous session
- **THEN** all three SHALL become visible in their respective UI surfaces (Profile Manager dialog, library badge and dialog, AI settings) after the initial loading state resolves, without the user being asked to recreate them; loading states use `useLiveQuery`'s `undefined` return value to render skeletons or "Loading…" messages until the data resolves

#### Scenario: Active profile join is observed atomically within a single tab

- **WHEN** the active profile changes from `A` to `B` via the `setActiveProfile` use case (which writes the `meta.activeProfileId` row) followed by an unrelated mutation to the `profiles` table within the same tab, with both observations propagated by `useLiveQuery`
- **THEN** every same-tab consumer of `useActiveProfileLive()` SHALL observe a single transition from `{id: "A", profile: ProfileA}` directly to `{id: "B", profile: ProfileB}` — never `{id: "B", profile: null}` or `{id: "B", profile: ProfileA}` as an intermediate render

#### Scenario: Health Hub sleep page sees an imported FIT sleep file in real time

- **WHEN** the user imports a Garmin FIT sleep file from the Settings → Import section, the `importHealthFitFile` use case persists the result via `persistence.healthSleep.upsertMany`, and the toast confirming success fires
- **THEN** the Health Hub `/health/sleep` page SHALL update without a manual remount or page refresh — the test verifies via `waitFor` that the new sleep record appears in the rendered list, with the `useHealthSleepWeekLive` hook handling the live-query subscription
