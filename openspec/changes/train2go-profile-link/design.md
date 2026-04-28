## Context

The SPA already has two well-formed concepts that this change ties together:

1. **`Profile`** (`types/profile.ts`) — `{ id, name, bodyWeight, sportZones, createdAt, updatedAt }`. Persisted in Dexie `profiles` table. One profile is active at a time (`meta.activeProfileId`). Profile ownership of training zones is the established pattern; extending it to "linked external accounts" reuses that ownership model.

2. **`PersistencePort`** (`ports/persistence-port.ts`) — repository interfaces consumed by stores. Already includes `workouts`, `templates`, `profiles`, `aiProviders`, `syncState`, `usage`. The `[source+sourceId]` index on `workouts` (Dexie v1) was provisioned for this kind of integration but is currently unused.

**Glossary.** Throughout this change, `getActiveId()` refers to the existing `meta` table accessor `ProfileRepository.getActiveId(): Promise<string | null>` (see `dexie-profile-repository.ts:27-30`). It is correct to use `getActiveId()` for _reads_ (e.g., the `useActiveProfile` hook) but it is an **anti-pattern inside the link / sync / cascade-delete use cases**, which must take `profileId` as an explicit argument captured at user-action time (see D3 / D5). The proposal calls this rule out repeatedly to defend the profile-switch-mid-poll race and the cascade-delete-wrong-profile race.

Today's coaching flow (Train2Go):

- `Train2GoStore` (Zustand) holds activities in memory only.
- `useTrain2GoSource` adapts the store to the generic `CoachingSource` port.
- `useCoachingActivities` flattens all sources, groups by date, returns to `CalendarPage`.
- Click handler on `CoachingActivityCard` toggles in-place description; no editor entry point.
- Spec `spa-train2go-extension` explicitly forbids Dexie storage of activities.

The transient model causes three concrete failures the user hit:

- "Sync" output evaporates on reload.
- Click on a card opens nothing.
- No link between a Train2Go account and a Kaiord profile (multi-profile users have no separation; single-profile users still rediscover `userId` on every ping).

## Goals / Non-Goals

**Goals:**

- Link a Train2Go account to a specific Kaiord `Profile` via a generic `LinkedCoachingAccount` shape — extensible to TrainingPeaks/others without schema reshaping.
- Persist coaching activities in Dexie, scoped per profile, keyed for upsert.
- Survive reload, week navigation, and tab switches without re-syncing.
- Auto-sync on calendar mount and week change with a freshness gate; manual sync remains available.
- Click-on-card opens a real dialog with description, metadata, and a "Convert to workout" action that creates a `raw` `WorkoutRecord` and routes the user into the existing editor pipeline.
- Keep the `CoachingSource` port generic; future sources implement the same port without UI work.

**Non-Goals:**

- Bidirectional sync (Kaiord → Train2Go writes). Read-only this round.
- Parsing structured intervals out of Train2Go descriptions. Convert-to-workout produces a `raw` workout; the existing AI batch flow handles structuring.
- Building a second coaching adapter (TrainingPeaks). The capability is generic, but only Train2Go is wired.
- Multi-account-per-source on a single profile (e.g., two Train2Go accounts on one profile). One source = one account per profile.
- A second active profile concept. Active-profile semantics remain unchanged; coaching scopes to whatever the active profile is.

## Decisions

### D1. Profile owns linked accounts (not a separate table)

`Profile.linkedAccounts: LinkedCoachingAccount[]` extends the existing schema:

```ts
type LinkedCoachingAccount = {
  source: string; // "train2go", future: "trainingpeaks"
  externalUserId: string; // string for forward-compat (Train2Go is numeric today)
  externalUserName: string;
  linkedAt: string; // ISO datetime
};
```

Uniqueness invariant: at most one entry per `source` per profile (enforced by domain helper `linkAccount`/`unlinkAccount`, not Dexie).

**Why on Profile and not a separate `linkedAccounts` table?**

- Profile already owns user-identity-shaped data (name, body weight, zones). Linked accounts are user-identity data.
- Avoids a join on every calendar render — the active profile is in memory.
- Profile delete cascades to linked accounts naturally (no orphan rows).
- Matches the existing pattern where `profiles` is a single rich row, not a normalized graph.

**Alternative considered:** dedicated `linkedAccounts` table keyed by `[profileId+source]`. Rejected — adds a second live query for no real benefit at current scale (profiles are <10 typically).

### D2. New `coachingActivities` Dexie table; do NOT extend `workouts`

```
coachingActivities: "id, [profileId+date], [profileId+source+sourceId], [profileId+source]"
```

`id` = `${profileId}:${source}:${sourceId}` (deterministic, supports upsert and equality dedupe).

```ts
type CoachingActivityRecord = {
  id: string; // composite as above
  profileId: string; // owning profile
  source: string; // "train2go"
  sourceId: string; // platform's id, captured as string at the JSON parse boundary
  date: string; // YYYY-MM-DD
  sport: string; // raw sport key from source (mapper applies icon)
  title: string;
  duration?: string; // free-text from source ("01:30:00", "Z2 60'")
  workload?: number; // raw platform metric — NOT clamped, NOT lossy
  intensity?: 1 | 2 | 3 | 4 | 5; // mapper-normalized 1-5 (Train2Go: clamp(workload, 1, 5))
  status: "pending" | "completed" | "skipped";
  completionPercent?: number; // 0-100, distinct from status (a "completed" activity can be 85% done)
  description?: string; // populated lazily on expand
  fetchedAt: string; // ISO — drives staleness; refreshed on sync
  // No internal Kaiord state machine — these are coach-owned.
};
```

**Why three orthogonal effort/status fields?**

- `workload` preserves the platform's native signal (Train2Go: 0-N, TrainingPeaks: TSS 0-1000+) without lossy reduction. Future analytics need this.
- `intensity` is a UI-friendly 1-5 dot indicator. Each platform's mapper documents its normalization rule (Train2Go: `clamp(workload, 1, 5)`; TrainingPeaks: `tssToIntensity(tss)`).
- `status` ∈ pending/completed/skipped is the coach's discrete workflow state.
- `completionPercent` captures partial completion (the existing Train2Go `completion` field, 0-100) — orthogonal to `status` because a coach can mark an activity completed even when only 85% was done.

**Why string `sourceId` (not number)?**
JavaScript's `JSON.parse` lossily reduces integers above `Number.MAX_SAFE_INTEGER` (2^53 − 1) before any later `String()` cast can recover them. The Train2Go transport adapter MUST stringify `userId` and any activity ids at the parse boundary using a JSON reviver (or by parsing into a string-typed shape) — never via `String(parsedNumber)` after the fact. This rule applies to BOTH `linkedAccounts[].externalUserId` and `coachingActivities.sourceId`.

**Why not extend `WorkoutRecord` with a `kind: "coaching"` discriminator?**

- `WorkoutRecord` has its own state machine (raw → structured → ready → pushed) that does not apply to coach activities (which have an external pending/completed/skipped status owned by the coach).
- Conversion is an explicit user action, not an in-place flip. A user might convert a coaching activity, leave the original intact, and convert it again later (idempotent — second conversion returns the same workout id).
- Keeps the `workouts` table semantics narrow ("things the user owns and can export").
- Calendar can render both via two parallel live queries; merge happens in the view layer (already does this for transient coaching cards today).

**Trade-off:** the unused `[source+sourceId]` index on `workouts` stays unused for now. That index becomes load-bearing if/when we add the convert-to-workout path that records the originating coach activity (D5 below uses it).

### D3. Active-profile-scoped sync; userId comes from the profile, not the ping

Currently `Train2GoStore.userId` is hydrated from each `ping` response. Going forward:

- `userId` is read from the active profile's `linkedAccounts` entry where `source === "train2go"`.
- `ping` is used **only during the connect flow** to discover `userId`/`userName`. The Zustand store no longer holds them, and **`detectExtension` (called on heartbeat / visibility change / boot) MUST NOT mutate `linkedAccounts`** — it only toggles `extensionInstalled`/`sessionActive`. Auto-link on heartbeat would silently re-link a profile the user just disconnected.
- If no linked account exists, the calendar shows a "Connect Train2Go" prompt routing to **Profile Settings → Linked Accounts**, not to a calendar-local action. (Calendar's previous Connect button is removed; only Sync remains, gated on `linkedAccounts`.)

**Why move connect into profile settings?**

- Linking is a profile-management decision, not a calendar action.
- A user with two profiles (e.g., one for triathlon, one for running) should be able to link different accounts — the profile dialog is the natural place.
- Disconnect is now obvious (where you linked, you unlink).

**Connect-flow profile race — capture target id at flow start.**
The connect flow polls `ping` for up to ~10s. If the user switches the active profile mid-poll, naively calling `linkAccount` with `getActiveId()` writes credentials to the wrong profile. Mitigation: the connect flow captures `targetProfileId` synchronously when the user clicks "Connect Train2Go" in Profile Settings, and the `linkAccount(profileId, account)` use case takes `profileId` as an explicit argument (not `getActiveId()`). If the active profile changes during the poll:

- The link still completes against `targetProfileId` (the user's intent at click time wins).
- The UI surfaces a small toast: "Linked Train2Go to <targetProfileName>." so the user is not surprised when switching back.

**Connect-flow abandon — `AbortSignal` cancels the poll.**
`attemptLink(targetProfileId, signal: AbortSignal)` accepts an abort signal. The `LinkedAccountsSection` creates an `AbortController` on click, passes the signal, and aborts on:

- The connect modal/section unmounting (user navigates away from Profile Settings).
- The user clicking "Disconnect" on the same source while a poll is in flight (concurrent intent reversal).
  On abort, the use case stops polling, does NOT call `linkAccount`, and resolves silently. No toast, no `lastError`. This rule covers both the abandon case and the within-same-profile disconnect-mid-connect race.

**`linkAccount` and the deleted-profile race.**
If `getById(profileId)` returns `undefined` inside `linkAccount` (the target profile was deleted between click and poll completion), the use case throws `ProfileNotFoundError`. The caller (`attemptLink`) surfaces a single toast: "Profile no longer exists; not linked." No partial state is written.

**`unlinkAccount` is idempotent.** Unlike `linkAccount`, `unlinkAccount(profileId, source)` MUST be a no-op (silent success) when the profile no longer exists OR when the source is not linked. Disconnect is the user's intent to "be in the unlinked state"; if the state is already that or the row is gone, the intent is already satisfied. This avoids spurious error toasts during disconnect-during-deletion races.

**Disconnect-after-successful-link ordering.** If a connect poll resolves successfully and the user then immediately clicks Disconnect, the sequence is:

1. `attemptLink` resolves, calls `linkAccount(targetProfileId, ...)` — link is written.
2. The disconnect handler observes the link is now present (or fires regardless) and calls `unlinkAccount(targetProfileId, source)` — link is removed.

The "abort the in-flight poll" path covers the case where the user disconnects WHILE the poll is in flight (no link yet written). The "unlink after link" path covers the case where the link was already written. The handler in `LinkedAccountsSection` checks `controller.signal.aborted` first; if not aborted but the link is in `linkedAccounts`, fall through to `unlinkAccount`.

**Privacy note on network traces.** `externalUserId` is sent on every `read-week`/`read-day`/`ping` request. The browser's network tab and any third-party error reporting integrated with the page will see it. The privacy guarantee is "Kaiord does not log this identifier in our own logs / toasts / `lastError` strings"; we cannot prevent the browser from displaying it in DevTools.

### D4. Auto-sync with staleness gate via a dedicated `coachingSyncState` table

The existing `syncState` table is **bridge-discovery-shaped** — its rows carry `extensionId`, `lastSeen`, `capabilities`, `protocolVersion`. Overloading it for coaching staleness would force coaching writers to invent sentinel values for fields they don't own, blur its semantics, and complicate the bridge-discovery logic that consumes it today.

Decision: introduce a **separate `coachingSyncState` table** dedicated to coaching staleness. This keeps the bridge-discovery `syncState` table untouched.

```
coachingSyncState: "[source+profileId], source, profileId"
```

Row shape (explanatory; see `spa-persistence-port` `CoachingSyncStateRepository` for the normative definition):

```ts
type CoachingSyncStateRecord = {
  source: string; // e.g., "train2go"
  profileId: string; // owning Kaiord profile
  lastSyncedAt: string; // ISO datetime — staleness signal
};
```

Primary key is the compound `[source+profileId]`, so reads and writes for `(train2go, p1)` are O(1) without secondary scans. The bare `source` and `profileId` indexes support cascade-delete and source-wide invalidation if needed.

`fetchedAt` on each activity row is the canonical staleness signal at the per-row level; `coachingSyncState` is the cheap per-week check ("should I sync this week?") without scanning activity rows.

Rule: on calendar mount and on week navigation, if `now - lastSyncedAt > 10 minutes`, call `syncWeek(profileId, weekStart)`. Manual Sync button bypasses the gate. `lastSyncedAt` is updated UNCONDITIONALLY on a successful fetch, including zero-activity responses, so an empty week doesn't keep re-firing the gate.

### D5. "Convert to workout" — explicit, idempotent, profile-scoped

Mapper `coaching-to-workout.mapper.ts`:

- Input: `CoachingActivityRecord`
- Output: `WorkoutRecord` with:
  - `id` = `nanoid()` (new workout)
  - `state` = `"raw"`
  - `source` = `activity.source` (e.g., `"train2go"`)
  - `sourceId` = `${activity.profileId}:${activity.sourceId}` — **namespaced by profile** so the existing `[source+sourceId]` index on `workouts` makes idempotency profile-scoped without adding a `profileId` column to `WorkoutRecord` (out of scope for this change).
  - `date` = activity.date
  - `sport`, `title`, `description` carried over
  - No `steps` — raw workout, processed by AI batch later
- Idempotency: before creating, the use case calls `workouts.getBySourceId(activity.source, namespacedSourceId)`. If a record exists, navigate to its editor instead of creating a duplicate.
- If `WorkoutRepository.put` rejects, the use case re-throws and the caller (the dialog) surfaces an error toast and does NOT navigate — leaving the user on the dialog so they can retry.

**Note on namespace asymmetry.** The coaching activity's primary key is `${profileId}:${source}:${sourceId}` (three components). The workout's namespaced sourceId is `${profileId}:${rawSourceId}` (two components — `source` is omitted because `WorkoutRecord.source` is already a separate column, so encoding it again would be redundant). The asymmetry is deliberate; `namespaceSourceId(profileId, rawSourceId)` is the only place the rule lives.

**Why namespace `sourceId`?**

- Two profiles linking the same Train2Go account → each profile may want its own editable workout from the same source activity. With raw `sourceId`, profile B's "Convert" would resolve to profile A's already-created workout — wrong.
- Adding `profileId` to `WorkoutRecord` is the cleaner long-term fix but bigger blast radius (touches every workout call site). Defer.
- Trade-off: any future code that wants to "find the workout for this Train2Go activity" must namespace the sourceId the same way. Document at the mapper boundary; expose a helper `namespaceSourceId(profileId, rawId)` so the rule is enforced in one place.

**Why a use case (`convertCoachingActivity`) instead of inline in the dialog?**

- Idempotency check + write + navigate is a multi-step orchestration — fits application layer.
- Future: convert may also archive the coaching activity or mark it as "converted" in metadata.

### D6. Schema migration: Dexie v4 with profile backfill

```ts
this.version(4)
  .stores({
    workouts: "...",
    templates: "...",
    profiles: "id",
    aiProviders: "id",
    syncState: "source",
    usage: "yearMonth",
    meta: "key",
    bridges: "extensionId, status, lastSeen",
    coachingActivities:
      "id, [profileId+date], [profileId+source+sourceId], [profileId+source]",
    coachingSyncState: "[source+profileId], source, profileId",
  })
  .upgrade(async (tx) => {
    await tx
      .table("profiles")
      .toCollection()
      .modify((row) => {
        if (!row.linkedAccounts) row.linkedAccounts = [];
      });
  });
```

No migration needed for `workouts` — schema string unchanged, and the existing `[source+sourceId]` index becomes load-bearing only on convert (D5).

### D7. Hexagonal placement

| Concern                             | Layer       | File(s)                                                                                                                                                                                                                                         |
| ----------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LinkedCoachingAccount` type+Zod    | domain      | `types/profile.ts` (extend), `types/coaching-account.ts` (new)                                                                                                                                                                                  |
| `CoachingActivityRecord` type+Zod   | domain      | `types/coaching-activity-record.ts` (new)                                                                                                                                                                                                       |
| `CoachingRepository` interface      | port        | `ports/persistence-port.ts` (extend `PersistencePort`)                                                                                                                                                                                          |
| Active-profile coaching use cases   | application | `application/coaching/*` — `linkAccount(profileId, account)`, `unlinkAccount(profileId, source)`, `syncWeek(profileId, weekStart)`, `expandDay(profileId, date)`, `convertCoachingActivity(activityId)`                                         |
| Active profile use case (pure)      | application | `application/profile/get-active-profile.ts` — async `getActiveProfile(): Promise<Profile \| null>`. Port-only, framework-free.                                                                                                                  |
| Active profile React hook           | UI hook     | `hooks/use-active-profile.ts` — `useActiveProfile()` returning `{ id, profile, isLoading }`. Wraps the use case via `useLiveQuery`. Framework-coupled, intentionally outside the application layer. Required by every coaching hook downstream. |
| Wire → Record mapper (per-source)   | adapter     | `adapters/train2go/train2go-record.mapper.ts` (new) — `Train2GoActivity` → `CoachingActivityRecord`. Stringifies ids at the parse boundary. Documents the `clamp(workload, 1, 5)` normalization for `intensity`.                                |
| Record → ViewModel mapper (generic) | adapter     | `adapters/train2go/coaching-record-to-activity.mapper.ts` (new) — `CoachingActivityRecord` → `CoachingActivity` view-model. Platform-agnostic.                                                                                                  |
| Dexie repository                    | adapter     | `adapters/dexie/dexie-coaching-repository.ts`                                                                                                                                                                                                   |
| In-memory repository (tests)        | adapter     | `test-utils/in-memory-coaching-repository.ts`                                                                                                                                                                                                   |
| Train2Go transport (unchanged)      | adapter     | `store/train2go-extension-transport.ts` — JSON parse boundary stringifies `userId` and activity ids before the rest of the codebase sees them                                                                                                   |
| Train2Go source adapter             | adapter     | `adapters/train2go/use-train2go-source.ts` — exposes `query(profileId, days)` (returns `useLiveQuery`-backed activities), `sync`, `expand`, `connect`. Does NOT bake activities at bootstrap (see "Live-query placement" below).                |
| CoachingActivityDialog UI           | UI          | `components/molecules/CoachingCard/CoachingActivityDialog.tsx`                                                                                                                                                                                  |
| Profile settings linked-accounts    | UI          | `components/organisms/ProfileManager/LinkedAccountsSection.tsx`                                                                                                                                                                                 |
| Auto-sync hook                      | UI          | `hooks/use-coaching-auto-sync.ts`                                                                                                                                                                                                               |

The Train2Go store is _not_ deleted — it still owns transport state (`extensionInstalled`, `sessionActive`, `loading`, `lastError`). It loses ownership of `userId`, `userName`, and `activities`.

**Live-query placement (refines D2).** `CoachingRegistryBootstrap` mounts above the calendar route and does not know which week the user is viewing. So `useTrain2GoSource` cannot bake an `activities: CoachingActivity[]` array via `useLiveQuery(getByProfileAndDateRange(profileId, weekStart, weekEnd))` at bootstrap — `weekStart`/`weekEnd` don't exist there. The `CoachingSource` port is therefore extended:

```ts
type CoachingSource = {
  id: string;
  label: string;
  badge: string;
  available: boolean;
  connected: boolean;
  loading: boolean;
  error: string | null;
  // Replaces baked `activities: CoachingActivity[]`:
  query: (profileId: string, days: string[]) => CoachingActivity[];
  sync: (profileId: string, weekStart: string) => void;
  expand: (profileId: string, date: string) => void;
  connect: (profileId: string) => void;
};
```

`useCoachingActivities(days)` calls each source's `query(profileId, days)` (the source's `query` is a hook itself: `useLiveQuery` lives inside `useTrain2GoSource.query`). This preserves "zero platform imports in calendar" and keeps `useLiveQuery` scoped to the visible week. The bootstrap registry mounts unchanged.

**Settings panel preservation.** The existing `Train2Go status in Settings panel` requirement (Extensions tab status row + Refresh Status button) is unaffected by this change: the Train2Go store still owns `extensionInstalled`/`sessionActive`/`lastError`. Refresh Status re-runs detection only — it does NOT touch `linkedAccounts`.

**Empty-state copy.** The existing `Platform-inclusive copy in empty states` requirement is updated so the Connect CTA in `FirstVisitState` and `NoBridgesState` routes to **Profile Settings → Linked Accounts**, never to a calendar-local connect action.

**PII hygiene.** `externalUserName` is real human-name PII. Adapter and use-case error logs, toast strings, and `lastError` values MUST NOT include `externalUserName` (or any other field of `LinkedCoachingAccount`). Toasts that name a profile (e.g., "Linked Train2Go to <Kaiord profile name>") are fine — the Kaiord profile name is user-chosen-locally, not third-party PII.

The `description` field on `CoachingActivityRecord` may contain coach commentary that mentions third-party names (e.g., "ride with Juan today"). It is persisted verbatim in IndexedDB and carried forward to a `WorkoutRecord` on convert-to-workout. This change extends Kaiord's local-only PII surface but introduces NO new outbound exposure — the only place description-shaped text crosses the wire today is the `step.notes → description` mapping in `packages/garmin/src/adapters/converters/garmin-workout-step.converter.ts:81` (step-level, not workout-level). The workout-level `description` field carried by `convertCoachingActivity` does not flow through any current export adapter. We accept the local persistence; an end-to-end "convert-then-push leaks no description PII" assertion is deferred to a follow-up change scoped to the export pipeline (out of scope here).

**Heartbeat vs connect-flow path separation.** `detectExtension` and `attemptLink` both call the bridge `ping` action, but they MUST take separate code paths so future refactors cannot accidentally let a heartbeat ping write to `linkedAccounts`. Concretely: `detectExtension` consumes only `{ extensionInstalled, sessionActive }` from its ping response; the userId/userName fields, even when present in the payload, are ignored at this code path. `attemptLink` makes its own `ping` call (or reads via a separate transport function) and is the ONLY call site that extracts `userId`/`userName` and passes them to `linkAccount`. This separation is testable: a unit test asserts `detectExtension` never returns `userId` to its callers.

## Risks / Trade-offs

- **Coach-removed activities — sync deletes orphans within the fetched window.** `syncWeek(profileId, weekStart)` is NOT pure-upsert. After upserting the freshly-fetched activities, the use case computes the set of locally-persisted activities for `(profileId, source, weekStart..weekEnd)` whose `id` does not appear in the fetch payload, and deletes them. Window scoping is critical: deletion is bounded to the week being synced, never to the whole profile (otherwise a different week's activities would vanish). `coachingSyncState[(source, profileId)].lastSyncedAt` is updated UNCONDITIONALLY on a successful fetch — including a zero-activity response — so the staleness gate doesn't keep re-firing on empty weeks.
- **Stale activities after coach edits** → Auto-sync on mount/week-change with 10-min freshness gate covers most cases. A "Sync" button forces refresh. Long sessions on the same week without navigation can serve stale data; acceptable for a v1 (matches the human Train2Go web UX).
- **Profile deletion orphans coaching activities** → Add cascade delete in `convertCoachingActivity` use case? No — better in the profile delete use case: when a profile is deleted, also delete `coachingActivities` where `profileId = deleted.id`. Cheap query via the `[profileId+date]` index.
- **Active profile switch mid-session** → Live queries are scoped by `profileId`, so the calendar updates automatically on profile switch. The Train2Go store needs to invalidate `extensionInstalled`/`sessionActive` cache only if the new profile has a different linked account (different `userId` would otherwise read the wrong week). Decision: re-run detection on profile change. Cheap.
- **Two profiles with the same Train2Go account linked** → Allowed — both profiles see the same activities (different `id`s because the composite includes `profileId`). The duplicate fetch is wasteful but correct. Out-of-scope optimization.
- **Convert-to-workout idempotency vs. user wanting a copy** → Idempotency is the safer default; users wanting a copy can duplicate via the editor's existing duplicate action.
- **Train2Go tab not open during auto-sync** → Same failure mode as today's manual sync: `findTrain2GoTab` returns null, `train2goFetch` rejects. Auto-sync swallows the error into `lastError` (already handled), no toast spam. Manual Sync surfaces the error to the user.
- **Schema bump risk on existing users** → Dexie v4 is additive (new table, profile field backfill). No data is rewritten beyond `linkedAccounts: []`. Migration is idempotent.

## Migration Plan

1. **Implementation order** (each commit independently shippable):
   1. Domain types + Zod (`LinkedCoachingAccount`, `CoachingActivityRecord`)
   2. `CoachingRepository` port + Dexie adapter + in-memory adapter
   3. Dexie v4 migration (backfill `linkedAccounts: []`)
   4. Profile use cases: `linkAccount` / `unlinkAccount`
   5. Train2Go store refactor: stop owning `userId`/`activities`; transport-only
   6. `useTrain2GoSource` reads from repo; sync action delegates to `syncWeek` use case
   7. `CoachingActivityDialog` + `convertCoachingActivity` use case + click wiring
   8. Profile-settings "Linked Accounts" section + connect/disconnect UI
   9. `useCoachingAutoSync` hook on calendar
   10. Spec sync (`/opsx-sync`) + delete old "transient activities" rules

2. **Rollback**: Dexie v4 → v3 is not supported by Dexie's forward-only migration. Rollback is by reverting the SPA build; user data in `coachingActivities` is dropped on the next forward boot of a v3 build (browser keeps the table but the app ignores it). Linked accounts on profiles are tolerated by v3 (extra field, ignored).

3. **No data migration** required — there is no existing persisted coaching data. Today's transient activities are simply discarded; users re-sync once.

## Decided Questions (previously open)

1. **Coaching staleness storage** — DECIDED: introduce a dedicated `coachingSyncState` Dexie table primary-keyed by `[source+profileId]`, with row shape `{ source, profileId, lastSyncedAt }`. The bridge-discovery `syncState` table (which carries `extensionId`/`lastSeen`/`capabilities`/`protocolVersion`) is **untouched** — overloading it would have forced coaching writers to invent sentinel values for fields they don't own and conflated two unrelated semantics. See D4.
2. **Cascade delete on profile removal** — DECIDED: implement in this change. The profile delete use case calls `coaching.deleteByProfile(deletedProfileId)`. Important: the id passed MUST be the to-be-deleted profile's id, NOT `getActiveId()`. Converted `WorkoutRecord` rows are NOT cascaded — workouts are profile-agnostic today and survive profile deletion.
3. **Should "convert to workout" copy `intensity`/`status`/`completionPercent` into the workout?** DECIDED: no — `WorkoutRecord` doesn't have those fields, and the AI structuring step will produce richer data. The `coachingActivities` row remains as the source-of-truth for those signals.
4. **Do we keep the popup "Read This Week" button?** Recommendation (still open, low priority): demote it to a diagnostic ("show last sync timestamp"), or remove it entirely. The SPA is the system of record; the popup duplicating that flow risks confusion. Tracked separately — out of scope here.

## Open Questions

1. Whether to add `profileId` to `WorkoutRecord` long-term (would replace the namespaced-`sourceId` workaround in D5). Defer — bigger blast radius across the workout pipeline.
