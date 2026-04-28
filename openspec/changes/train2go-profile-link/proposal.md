## Why

Today, when the user clicks "Sync Train2Go" on the calendar, the activities appear as dashed cards but the data lives only in Zustand. Reloading the page or navigating to another week loses everything, so the user has to re-sync every time. There is also no link between Train2Go's `userId` (currently re-fetched on every ping) and the Kaiord `Profile`, so multi-profile users have no way to keep accounts separated, and there is no durable place to store "this Kaiord profile is connected to that Train2Go account".

Coaching activities are first-class data — they should survive reloads, be addressable per profile, and feed Kaiord's existing pipeline (calendar → editor → KRD → FIT/ZWO/GCN export).

## What Changes

- **Profile gains linked coaching accounts** — `Profile.linkedAccounts: LinkedCoachingAccount[]` with one account per `source` per profile (`{ source, externalUserId, externalUserName, linkedAt }`). `externalUserId` is stored as a string captured at the JSON parse boundary (lossless even for ids beyond `Number.MAX_SAFE_INTEGER`). The active profile drives which Train2Go account the calendar uses; the `profileId` targeted by the connect flow is captured at flow start, not re-resolved mid-poll.
- **New `coachingActivities` Dexie table** — composite primary key `${profileId}:${source}:${sourceId}`, indexed by `[profileId+date]`. Replaces the in-memory Zustand activities array as the source of truth. Survives reloads. Multi-week sync upserts instead of replacing. Carries both raw `workload` (platform-native, not lossy-clamped) and a normalized `intensity` 1-5 plus optional `completionPercent` so coach signals are not collapsed.
- **New `CoachingRepository` port + Dexie adapter** — implements PersistencePort for coaching activities. Stores update through this port; the calendar reads via `useLiveQuery` — same model as user-created workouts.
- **Auto-sync on calendar mount and week change** — staleness gate (default 10 minutes via `lastSyncedAt` in a new dedicated `coachingSyncState` table; the bridge-discovery `syncState` table is left untouched) avoids redundant fetches. Manual "Sync" button still available as a force-refresh.
- **Click on a coaching card opens a detail dialog** — replaces the silent in-place description toggle with a proper `CoachingActivityDialog` showing description, duration, effort, status, and a "Convert to workout" action.
- **"Convert to workout" action** — explicit user action that maps `CoachingActivity` → `WorkoutRecord` (state `raw`). The `WorkoutRecord.sourceId` is namespaced as `${profileId}:${rawSourceId}` so idempotency via the existing `[source+sourceId]` index is profile-scoped — converting the same Train2Go activity from two different Kaiord profiles produces two different workouts. Persists via `WorkoutRepository`, navigates to the editor. Re-conversion of an already-converted activity within the same profile is a no-op (the existing WorkoutRecord wins).
- **Connection flow lives in profile settings** — connecting/disconnecting Train2Go is a profile management action, not a calendar action. The CalendarHeader sync button only appears once the active profile has a linked Train2Go account.
- **BREAKING (internal contracts only)**: two internal contracts change in `spa-train2go-extension`:
  1. The "Train2Go data SHALL NOT be stored in Dexie. It is transient data" rule is REPLACED — coaching activities ARE persisted, scoped per profile.
  2. The Train2Go store shape loses `userId`, `userName`, and `activities` (these move to the active profile's `linkedAccounts` and to the persisted `coachingActivities` table respectively). No public API change; only internal SPA wiring.

## Capabilities

### New Capabilities

- `spa-coaching-integration`: Profile-anchored coaching platform linking, persisted coaching activities, auto-sync with staleness gate, and conversion of coaching activities into editable workouts. Generic across coaching sources (Train2Go today, TrainingPeaks/others later).

### Modified Capabilities

- `spa-train2go-extension`: Drop the "transient, not persisted" rule. The Train2Go store no longer owns activities — it owns transport (ping/read-week/read-day) and delegates persistence to the `CoachingRepository` keyed by the active profile. `userId` is sourced from the linked account on the active profile, falling back to ping detection only during the connect flow.
- `spa-persistence-port`: Add `CoachingRepository` to the PersistencePort surface, define the `coachingActivities` table schema (Dexie version bump), and add a profile schema field for `linkedAccounts`. Add upsert-by-`[source+sourceId]` semantics.
- `spa-calendar`: Coaching cards are read from the persisted store (live query) rather than transient Zustand state. Click on a coaching card opens a detail dialog with a "Convert to workout" action. The "Sync" button is gated on the active profile having a linked coaching account.

## Impact

**Affected packages:**

- `@kaiord/workout-spa-editor` — primary surface (profile types, Dexie schema bump, repositories, stores, calendar UI)

**Affected layers (hexagonal):**

- Domain (types): `Profile.linkedAccounts`, `LinkedCoachingAccount`, `CoachingActivityRecord`
- Ports: new `CoachingRepository` interface in `PersistencePort`
- Adapters: `DexieCoachingRepository`, `InMemoryCoachingRepository`, Train2Go adapter writes through the repo instead of Zustand
- UI: new `CoachingActivityDialog`, profile-settings "Linked Accounts" panel, calendar auto-sync hook

**Schema migration:**

- Dexie `version(4)` adds `coachingActivities` table and migrates `profiles` rows to default `linkedAccounts: []`
- No migration of existing data needed (today's coaching activities are not persisted)

**Specs touched:**

- New: `openspec/specs/spa-coaching-integration/spec.md`
- Modified (deltas): `spa-train2go-extension`, `spa-persistence-port`, `spa-calendar`

**Public API:** no changes — this is internal SPA wiring only. No `@kaiord/core` or adapter package changes.

**Out of scope:**

- TrainingPeaks or other coaching sources (the capability is generic, but no second adapter is built here)
- Bidirectional sync (marking an activity completed/skipped from Kaiord). This stays read-only from coach.
- Importing structured workout steps from Train2Go descriptions (description text remains a string; "Convert to workout" produces a `raw` workout the user processes via existing AI flow).
