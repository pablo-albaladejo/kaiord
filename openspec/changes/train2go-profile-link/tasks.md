## 1. Domain types and schemas

- [x] 1.1 Create `types/coaching-account.ts` with `LinkedCoachingAccount` type + Zod schema (`source`, `externalUserId: string`, `externalUserName`, `linkedAt: ISO datetime`)
- [x] 1.2 Extend `types/profile.ts` `profileSchema` with `linkedAccounts: linkedCoachingAccountSchema.array().default([])`. After this change, `Profile` is `{ ..., linkedAccounts: LinkedCoachingAccount[] }` (non-optional). Update existing test fixtures and any in-source `Profile` literals to include `linkedAccounts: []` (or rely on `parse()` to apply the default). Run a TypeScript compile after the schema change to surface every call site that needs updating.
- [x] 1.3 Add domain helpers `linkAccount(profile, account)` / `unlinkAccount(profile, source)` enforcing one entry per source per profile (replace-on-relink). These helpers operate on `Profile` values, not on the active-profile resolver — the `profileId` is always passed in by the caller.
- [x] 1.4 Unit tests for the helpers (replace, append, remove, missing-source no-op)
- [x] 1.5 Create `types/coaching-activity-record.ts` with `CoachingActivityRecord` type + Zod schema. Include `workload?: number` (raw, unclamped), `intensity?: 1|2|3|4|5`, `status` enum, `completionPercent?: number (0-100)`. The `date` field is `YYYY-MM-DD` interpreted in the user's local timezone, matching the `spa-calendar` week-id convention (Monday-start ISO weeks); document this in a JSDoc comment on the `date` field. Validate `profileId`, `source`, `sourceId` independently. Add a Zod `.refine()` asserting the invariant `id === \`${profileId}:${source}:${sourceId}\``— **NOT a regex on`id`** (sourceIds may contain arbitrary characters, including `:`or`-`).
- [x] 1.6 Add helper `namespaceSourceId(profileId, rawSourceId): string` returning `${profileId}:${rawSourceId}` (used by `convertCoachingActivity`). The helper deliberately omits `source` (already a separate column on `WorkoutRecord`); this asymmetry vs `coachingActivities.id` is intentional and lives only in this helper.
- [x] 1.6b Add `types/coaching-sync-state.ts` with `CoachingSyncStateRecord` type + Zod schema (`{ source: string, profileId: string, lastSyncedAt: ISO datetime }`). Distinct from existing `syncStateSchema` in `bridge-schemas.ts`, which remains untouched.
- [x] 1.7 Update `types/index.ts` exports
- [x] 1.8 Unit tests for schema validation (workload preserved unclamped; intensity clamped 1-5; status enum; composite-id format)

## 2. Persistence port

- [x] 2.1 Add `CoachingRepository` interface to `ports/persistence-port.ts` per spec (`getById(id)`, `getByProfileAndDateRange(profileId, start, end)`, `getByProfileAndSourceId(profileId, source, sourceId)`, `upsertMany`, `put`, `delete` — no-op for missing id, `deleteByProfile`)
- [x] 2.2 Add `CoachingSyncStateRepository` interface to `ports/persistence-port.ts` (`getBySourceAndProfile(source, profileId)`, `put(record)`, `deleteByProfile(profileId)`). Distinct from the existing `SyncStateRepository` (which serves the bridge-discovery `syncState` table and is unchanged).
- [x] 2.3 Add `coaching: CoachingRepository` and `coachingSyncState: CoachingSyncStateRepository` to `PersistencePort`
- [x] 2.4 Update any composition root that builds `PersistencePort` to require the new fields (TypeScript will surface call sites)

## 3. Dexie adapter

- [x] 3.1 Bump Dexie schema to `version(4)` in `adapters/dexie/dexie-database.ts`:
  - Add `coachingActivities: "id, [profileId+date], [profileId+source+sourceId], [profileId+source]"`
  - Add `coachingSyncState: "[source+profileId], source, profileId"` (compound primary key)
  - Existing `syncState` table schema string is UNCHANGED — bridge-discovery rows are untouched
  - `.upgrade()` step backfills `linkedAccounts: []` on profiles. No backfill on `syncState`.
- [x] 3.2 Create `adapters/dexie/dexie-coaching-repository.ts` implementing `CoachingRepository` (factory `createDexieCoachingRepository(db)`). Do NOT export raw table access — `getByProfileAndDateRange` is the only public read API. `delete(id)` MUST be a no-op when the row is absent (Dexie's `.delete()` already behaves this way; assert in test).
- [x] 3.3 Create `adapters/dexie/dexie-coaching-sync-state-repository.ts` implementing `CoachingSyncStateRepository`.
- [x] 3.4 Wire both new repos into the adapter composition (`adapters/dexie/dexie-persistence-adapter.ts` or equivalent)
- [x] 3.5 Integration tests for `dexie-coaching-repository`: upsert idempotency, multi-week persistence, cascade delete by profile, profile isolation (X never returns Y's rows), `delete(missingId)` is a no-op
- [x] 3.6 Integration tests for `dexie-coaching-sync-state-repository`: get/put round-trip with compound key, cascade delete by profile, isolation between profiles
- [x] 3.7 Migration test (forward): seed v3 DB with profiles missing `linkedAccounts`; open v4; assert backfill (`linkedAccounts: []`); assert `coachingSyncState` table exists and is empty; assert bridge `syncState` rows are unchanged byte-identically; assert v4's `syncState` store schema string equals `"source"` byte-identically (no compound index added) AND v4's `coachingSyncState` store schema string equals `"[source+profileId], source, profileId"` byte-identically — both guard against accidental future regressions.
- [x] 3.8 Migration test (forward-tolerance): seed v4 DB with `linkedAccounts: [...]`; open under v3 schema strings; assert Dexie preserves the unknown field without throwing

## 4. In-memory adapter (tests)

- [x] 4.1 Create `test-utils/in-memory-coaching-repository.ts` mirroring the port surface using a `Map<string, CoachingActivityRecord>`
- [x] 4.2 Create `test-utils/in-memory-coaching-sync-state-repository.ts` mirroring the new port using a `Map<string, CoachingSyncStateRecord>` keyed by `${source}:${profileId}`
- [x] 4.3 Add both to the in-memory persistence composition root
- [x] 4.4 Tests for the in-memory repos behavior parity (same scenarios as Dexie, sans IndexedDB)

## 5. Application use cases

- [x] 5.1 Create `application/profile/get-active-profile.ts` — pure async `getActiveProfile(): Promise<Profile | null>`. Port-only, framework-free. No React imports.
- [x] 5.2 Create `hooks/use-active-profile.ts` — React hook `useActiveProfile()` returning `{ id, profile, isLoading }` via `useLiveQuery`. Wraps the pure use case from 5.1. Required by every coaching hook downstream — must exist before tasks 7.x, 8.x, 9.x.
- [x] 5.3 Create `application/coaching/link-account.ts` — signature `linkAccount(profileId, account)`. Reads the profile by id; if `getById(profileId)` returns `undefined`, throws `ProfileNotFoundError` (defined in `application/profile/errors.ts`). Otherwise calls the `linkAccount` domain helper and persists via `ProfileRepository.put`. MUST NOT call `getActiveId()` internally.
- [x] 5.4 Create `application/coaching/unlink-account.ts` — `unlinkAccount(profileId, source)`. Idempotent: silent no-op when the profile no longer exists OR when the source is not linked. Never throws `ProfileNotFoundError`. (Disconnect intent is satisfied by absence; do not surface error toasts on already-absent state.)
- [x] 5.5 Create `application/coaching/sync-week.ts` — signature `syncWeek(profileId, weekStart)`. `weekStart` is the ISO Monday of the target week (`YYYY-MM-DD`). Reads `profileId`'s `linkedAccounts`, resolves `userId`, calls Train2Go transport, maps payload via `train2go-record.mapper.ts`. Steps inside the use case:
  - Compute `weekEnd = weekStart + 6 days`.
  - Read locally-persisted activities via `coaching.getByProfileAndDateRange(profileId, weekStart, weekEnd)` filtered to the same source.
  - `coaching.upsertMany(fetchedRecords)`.
  - Compute orphans = local rows whose `id` is not in the fetched payload; call `coaching.delete(id)` for each (orphan cleanup, scoped strictly to the synced week). Tolerate already-deleted rows (`delete` is no-op for missing id).
  - `coachingSyncState.put({ source, profileId, lastSyncedAt: now })` UNCONDITIONALLY (including zero-activity responses) so the staleness gate doesn't re-fire on empty weeks.
- [x] 5.6 Create `application/coaching/expand-day.ts` — signature `expandDay(profileId, date)`. Calls `read-day`. The response typically contains every activity for that day; the use case SHALL upsert ALL returned activities (not just one) via `CoachingRepository.upsertMany` so sibling descriptions are persisted in a single transaction.
- [x] 5.7 Create `application/coaching/convert-coaching-activity.ts` — reads activity, computes `namespacedSourceId = namespaceSourceId(activity.profileId, activity.sourceId)`, checks idempotency via `WorkoutRepository.getBySourceId(activity.source, namespacedSourceId)`, otherwise creates `WorkoutRecord` with `state: "raw"` and `sourceId: namespacedSourceId`. If `WorkoutRepository.put` rejects, the use case re-throws (the dialog catches it, surfaces an error toast, and stays open — no navigation). Returns workout id on success.
- [x] 5.8 Create `application/coaching/attempt-link.ts` — `attemptLink(targetProfileId, signal: AbortSignal)`. Opens Train2Go tab, polls ping with abort checks each iteration. On `signal.aborted`, returns silently (no toast, no error, no link). On success, calls `linkAccount(targetProfileId, ...)`. On `ProfileNotFoundError`, surfaces a toast "Profile no longer exists; not linked".
- [x] 5.9 Unit tests for each use case using in-memory repos:
  - `linkAccount` writes to the supplied `profileId` (NOT `getActiveId()`); profile-switch race test
  - `linkAccount` throws `ProfileNotFoundError` when target profile was deleted
  - `unlinkAccount` is a silent no-op when target profile was deleted
  - `unlinkAccount` is a silent no-op when source is not linked
  - `syncWeek` resolves userId from supplied profile, errors when not linked
  - `syncWeek` deletes orphans within the synced week but never touches other weeks
  - `syncWeek` updates `lastSyncedAt` even on zero-activity responses
  - `expandDay` upserts siblings (not just clicked activity)
  - `convertCoachingActivity` is idempotent within a profile, distinct between profiles
  - `convertCoachingActivity` re-throws on `put` rejection; caller handles (no navigation)
  - `attemptLink` aborts cleanly when signal fires mid-poll (no link written)

## 6. Train2Go store + transport refactor

- [x] 6.1 Update `store/train2go-extension-transport.ts` (the JSON parse boundary): parse `userId` and activity ids as strings via JSON reviver (or equivalent) — never `String(parsedNumber)` after the fact. Document the rule at the top of the file.
- [x] 6.2 Remove `userId`, `userName`, `activities` from `store/train2go-store.ts` `Train2GoStore` type and initial state. Keep `extensionInstalled`, `sessionActive`, `loading`, `lastError`, `lastDetectionTimestamp`.
- [x] 6.3 Update `store/train2go-store-actions.ts` so `fetchWeek`/`fetchDay` delegate to `syncWeek`/`expandDay` use cases (no in-store activity array, no userId resolution in the store).
- [x] 6.4 Update `store/train2go-detect.ts` so `detectExtension` ONLY toggles `extensionInstalled`/`sessionActive`/`lastError`/`lastDetectionTimestamp`. It MUST NOT call `linkAccount` and MUST NOT mutate any profile. (Auto-link on heartbeat would silently re-link a disconnected profile.)
- [x] 6.5 (moved to task 5.8 — `attemptLink(targetProfileId, signal)` lives in the application layer, used by `LinkedAccountsSection`)
- [x] 6.6 Tests:
  - `detectExtension` does NOT call any link use case (heartbeat-after-disconnect test: link, disconnect, fire detect — `linkedAccounts` stays empty)
  - Lossless userId: synthetic transport response with userId `"9999999999999999"` round-trips byte-identically
  - Profile-switch-mid-poll: `attemptLink(A)` started, active profile flips to B during poll, link still resolves to A
  - Disconnect-after-successful-link: poll resolves and `linkAccount` writes; the user then clicks Disconnect; the disconnect handler runs `unlinkAccount` (does NOT skip the unlink just because the poll already resolved)
  - Wire-abort on connect cancel — case (a): AbortSignal fires BEFORE the transport response arrives; assert no `linkAccount` is invoked and the in-flight `ping` is aborted (controller's `signal.aborted === true`)
  - Wire-abort on connect cancel — case (b): AbortSignal fires AFTER the transport response is in flight (response races in post-abort); assert no `linkAccount` is invoked and the late response is discarded
- [x] 6.7 PII redaction audit covering THREE surfaces: (a) `console.error` / structured-log paths in `train2go-store-actions.ts` and transport, (b) `lastError: string` values written by the store on failure paths (session expired, tab closed, transport reject) — assert no `externalUserName` or `externalUserId` appears, (c) toast strings emitted by `LinkedAccountsSection` and the dialog. Add a snapshot test exercising each failure path with known PII values and asserting they are absent from all three surfaces.
- [x] 6.8 Heartbeat vs connect-flow path separation: assert (via unit test) that `detectExtension` never returns `userId`/`userName` to callers. `attemptLink` calls its own `ping` (or a separate transport function) and is the sole code path that extracts those fields.

## 7. CoachingSource port and Train2Go adapter

- [x] 7.1 Update `types/coaching-source.ts` — replace `activities: CoachingActivity[]` with `query: (profileId: string, days: string[]) => CoachingActivity[]`. Update `sync`, `expand`, `connect` signatures to take `profileId` explicitly.
- [x] 7.2 Audit existing `CoachingSource` consumers (`useCoachingActivities`, `useTrain2GoSource`, `CoachingRegistryBootstrap`, every test fixture under `src/test-utils/`) and update for the new port shape. After the refactor, `grep -r "CoachingSource" packages/workout-spa-editor/src` SHALL show zero remaining references to `.activities`.
- [x] 7.3 Update `useCoachingActivities(days)` to read `activeProfileId` from `useActiveProfile()` and call `source.query(activeProfileId, days)` per source. Group by date as today.
- [x] 7.4 Create `adapters/train2go/train2go-record.mapper.ts` (Wire → Record): `Train2GoActivity` → `CoachingActivityRecord`. Stringifies ids (or trusts the parse-boundary string), preserves raw `workload`, computes `intensity = clamp(workload, 1, 5)`, maps `completion → completionPercent`, and maps Train2Go status codes to the canonical enum: **`0 → "pending"`, `1 → "completed"`, `-1 → "skipped"`** (matches the existing `STATUS_MAP` in `adapters/train2go/train2go-mapper.ts`). Emits `source: "train2go"` (canonical lowercase ASCII). Unit-tests cover all three status codes, the workload→intensity boundary conditions (below-min, above-max, mid, missing), AND a parity test asserting the new mapper's status mapping equals the existing `STATUS_MAP` constant byte-identically (guards against silent drift if either side changes).
- [x] 7.5 Create `adapters/train2go/coaching-record-to-activity.mapper.ts` (Record → ViewModel): `CoachingActivityRecord` → `CoachingActivity`. Platform-agnostic; usable by any future source's UI.
- [x] 7.6 Refactor `adapters/train2go/use-train2go-source.ts`: implement `query(profileId, days)` via `useLiveQuery(() => coaching.getByProfileAndDateRange(profileId, days[0], days[days.length-1]))` then map each record via `coaching-record-to-activity.mapper.ts`. `sync(profileId, weekStart)` and `expand(profileId, date)` delegate to use cases.
- [x] 7.7 Tests: `query` reactivity (sync writes → next render reflects); profile isolation (P1 query never sees P2 rows); calendar zero-platform-imports preserved.

## 8. Calendar integration

- [x] 8.1 Create `hooks/use-coaching-auto-sync.ts` — fires `syncWeek(activeProfileId, weekStart)` for each linked source on mount and week change, gated by reading `coachingSyncState.getBySourceAndProfile(source, activeProfileId)` and checking `now - lastSyncedAt < 10 minutes`. Failures are silent (set `lastError` on the source's store slice, no toast).
- [x] 8.2 Wire `useCoachingAutoSync` into `CalendarPage`
- [x] 8.3 Update `CalendarHeader` to render Sync button only when active profile has a linked account for that source. Replace any calendar-local "Connect" affordance with a hint pointing to Profile Settings → Linked Accounts.
- [x] 8.4 Update calendar empty-state components (`FirstVisitState`, `NoBridgesState`) so the Connect CTA navigates to Profile Settings, not to a calendar-local action or modal.
- [x] 8.5 Tests: auto-sync fires on stale state, skips on fresh; profile switch invalidates staleness; missing linked account hides Sync; FirstVisitState Connect button navigates to Profile Settings; auto-sync failure is silent (lastError set on the source's `error` field, NO toast, no error re-thrown to the caller).

## 9. Coaching activity dialog and convert action

- [x] 9.1 Create `components/molecules/CoachingCard/CoachingActivityDialog.tsx` — title, sport, date, duration, intensity, status, completionPercent, description, "Convert to workout" button, "Close"
- [x] 9.2 Update `CoachingActivityCard.tsx` — remove in-place toggle; click handler opens the dialog via state in `CalendarDialogs`
- [x] 9.3 Wire `CalendarDialogs` to manage `selectedCoachingActivity` state and render `CoachingActivityDialog`
- [x] 9.4 Lazy-load description: when dialog opens with `description === undefined` (NOT `""` — a known-empty description does NOT re-fire), dispatch `expandDay(activeProfileId, activity.date)` use case (which upserts siblings too)
- [x] 9.5 Wire "Convert to workout" button to `convertCoachingActivity` use case, then `setLocation(`/workout/${id}`)`
- [x] 9.6 Tests: dialog opens with persisted description; dialog lazy-loads when `description === undefined`; dialog does NOT re-fire when `description === ""`; siblings get descriptions on lazy-load; convert is idempotent within a profile, distinct between profiles, and routes to editor; convert write-failure stays on dialog and surfaces error toast (no navigation); intensity-undefined activity renders without dots.

## 10. Profile settings — Linked Accounts panel

- [x] 10.1 Create `components/organisms/ProfileManager/LinkedAccountsSection.tsx` rendering one row per supported coaching source (currently `train2go`). Capture `targetProfileId = activeProfileId` synchronously on click — never resolve via `getActiveId()` later.
- [x] 10.2 If active profile has the source linked: show source label, `externalUserName`, `linkedAt`, and a "Disconnect" button (calls `unlinkAccount(profileId, source)` use case). On disconnect with a connect-poll-in-flight for the same source, abort the poll first.
- [x] 10.3 If not linked: show "Connect Train2Go" button that creates an `AbortController`, calls `attemptLink(targetProfileId, controller.signal)`, and stores the controller in component state so disconnect/unmount can cancel the poll.
- [x] 10.4 On `useEffect` cleanup (component unmount / panel close), call `controller.abort()` so abandoning Profile Settings cancels any in-flight connect poll cleanly (no toast, no link).
- [x] 10.5 If active profile changes during the poll, surface a toast "Linked Train2Go to <originalProfileName>." after success.
- [x] 10.6 If `attemptLink` rejects with `ProfileNotFoundError`, surface a toast "Profile no longer exists; not linked." and clear the in-flight state.
- [x] 10.7 Toast strings and error messages MUST NOT include `externalUserName` (use the Kaiord profile name instead). Add a unit test asserting no toast/error string contains the Train2Go username.
- [x] 10.8 Insert the section into the Profile Settings dialog/page next to Sport Zones.
- [x] 10.9 Tests: connect happy-path, polling timeout, disconnect, render when no extension installed, profile-switch-during-poll preserves intent, panel-unmount-during-poll aborts cleanly, concurrent-disconnect-during-connect aborts the poll, deleted-profile-during-poll surfaces ProfileNotFoundError toast.

## 11. Profile delete cascade

- [x] 11.1 If `application/profile/delete-profile.ts` does not yet exist, create it as a thin orchestration use case wrapping `ProfileRepository.delete`. The cascade lives here, not in the Dexie adapter, so it cannot be bypassed by direct port use. (Existing `ProfileRepository.delete` is preserved; the use case calls it after the cascade.)
- [x] 11.2 In the use case, call `coaching.deleteByProfile(deletedProfileId)` AND `coachingSyncState.deleteByProfile(deletedProfileId)` BEFORE `profiles.delete(deletedProfileId)`. The id passed MUST be the function argument's `deletedProfileId`, NEVER `getActiveId()`. Add a code comment naming the constraint.
- [x] 11.3 Update any UI handler that previously called `ProfileRepository.delete` directly to call the new use case instead.
- [x] 11.4 Test: deleting profile B while profile A is active leaves A's `coachingActivities` and `coachingSyncState` intact and removes only B's
- [x] 11.5 Test: deleting a profile does NOT cascade to converted `WorkoutRecord` rows (workouts survive profile deletion)

## 12. Observability and config hygiene (cross-cutting reviews)

These tasks address findings from the AWS Well-Architected Framework review (REL 6 — Workload monitoring; OPS 4 — Telemetry; OPS 8 — Utilize workload observability) and the 12-factor compliance review (Factor III — Config). The proposal is otherwise compliant; these are the only actionable cross-cutting follow-ups.

- [x] 12.1 Add coaching telemetry via the existing `analytics-port` (per the established pattern from `analytics-coverage-expansion`). Events to emit:
  - `coaching.sync.invoked` — payload `{ source, profileId, trigger: "manual" | "auto-mount" | "auto-week-change" }`
  - `coaching.sync.success` — payload `{ source, profileId, activityCount, orphansDeleted, durationMs }`
  - `coaching.sync.failure` — payload `{ source, profileId, errorKind, isAutoSync }` (distinguishes silent auto-failures from user-triggered failures — closes the REL 6 visibility gap)
  - `coaching.expand_day.invoked` — payload `{ source, profileId, hadCachedDescription }`
  - `coaching.convert.invoked` — payload `{ source }`
  - `coaching.convert.idempotent_hit` — emitted when re-conversion routes to an existing workout
  - `coaching.link.success` — payload `{ source }`
  - `coaching.link.abort` — payload `{ source, reason: "user-cancelled" | "panel-unmounted" | "concurrent-disconnect" }`
  - `coaching.link.failure` — payload `{ source, errorKind: "session-expired" | "profile-not-found" | "transport-error" }`
  - `coaching.unlink.success` — payload `{ source }`

  Event payloads MUST NOT include `externalUserName`, `externalUserId`, `sourceId`, or `description` — only enums, counts, and durations (PII redaction rule from design D7 PII hygiene paragraph). The `profileId` is local-only opaque ID, safe to include.

- [x] 12.2 Tests for telemetry: assert `coaching.sync.failure` with `isAutoSync: true` is emitted when auto-sync fails silently (Train2Go tab closed, session expired, transport error). Assert NO event payload contains any of the PII fields above. Snapshot test the emitted events for the happy-path link → sync → expand → convert → unlink flow.

- [x] 12.3 12-factor verification: after implementation, run `grep -rE "import\.meta\.env|VITE_" packages/workout-spa-editor/src/adapters/train2go packages/workout-spa-editor/src/application/coaching packages/workout-spa-editor/src/hooks/use-coaching* packages/workout-spa-editor/src/components/molecules/CoachingCard packages/workout-spa-editor/src/components/organisms/ProfileManager/LinkedAccountsSection* packages/workout-spa-editor/src/store/train2go-*` and assert ZERO matches. Confirms no environment-specific values were baked into the SPA bundle by this change (Factor III — Config).

## 13. Spec sync, lint, and changeset

- [x] 13.1 Run `pnpm -r test && pnpm -r build && pnpm lint:fix`
- [x] 13.2 Run `pnpm lint:specs` and `npx openspec validate train2go-profile-link --strict`
- [x] 13.3 `pnpm exec changeset` — `@kaiord/workout-spa-editor` minor (new feature: persistent coaching integration with profile linking)
- [ ] 13.4 `/opsx:verify` against this change to confirm all spec scenarios are covered by tests
- [ ] 13.5 After PR merge: `/opsx:archive` and `/opsx:sync` to update domain specs
