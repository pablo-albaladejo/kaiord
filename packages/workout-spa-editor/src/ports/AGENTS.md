<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/ports/`

## Purpose

Hexagonal port interfaces. Each `.ts` file here defines a repository contract that an adapter under `src/adapters/dexie/` (and an in-memory equivalent under `src/test-utils/`) satisfies. The aggregate `PersistencePort` in `persistence-port.ts` bundles every domain-table repo plus a `transaction(fn)` boundary that's the only multi-write atom available to application code.

## Key Files

- `persistence-port.ts` — aggregate `PersistencePort` type and the leaf types `TemplateRepository`, `ProfileRepository`, `AiProviderRepository`, `SyncStateRepository`, `UsageEventRepository`. Re-exports the leaf-file types below. Defines `transaction<T>(fn) => Promise<T>` (Dexie wraps `db.transaction("rw", db.tables, fn)`; in-memory implements snapshot/revert).
- `workout-repository.ts` — `WorkoutRepository`: `getById`, `getByDateRange`, `getByState`, `getBySourceId`, `put`, `delete`, `deleteByProfile`. Profile-scoped 1–1 since Dexie v13.
- `coaching-repositories.ts` — `CoachingRepository` + `CoachingSyncStateRepository`. `CoachingRepository` intentionally exposes no raw scan API — `getByProfileAndDateRange` is the only public scan, making profile isolation a structural property. `getById(id)` is composite-keyed.
- `session-match-repository.ts` — `SessionMatchRepository`: enforces uniqueness on `(profileId, coachingActivityId)` and `(profileId, workoutId)`; has `updateCoachingActivityId` (heal path), `appendExecutedWorkoutIds` (Train2Go three-slot grouping), and the cascade hooks `deleteByActivityId`/`deleteByWorkoutId`/`deleteByProfile`.
- `auto-match-dismissal-repository.ts` — `AutoMatchDismissalRepository`: per `(profileId, weekStart)` dismissals with cascade-on-profile-delete.
- `user-preferences-repository.ts` — `UserPreferencesRepository`: per-profile UI prefs, lazy row creation, cascade-on-profile-delete.
- `chat-message-repository.ts` — `ChatMessageRepository`: append-only chat transcript (`append`, `listByProfile`/`listByConversation` with optional most-recent-N windowing for model context, `deleteByConversation`, `deleteByProfile` cascade). The `deleteConversation` use case tombstones each removed message; the profile-cascade `deleteByProfile` follows the no-tombstone convention.
- `chat-conversation-repository.ts` — `ChatConversationRepository`: per-profile conversation rows (`put`, `get`, `listByProfile` most-recently-updated-first, `delete`, `deleteByProfile` cascade). Rows are mutable (rename/touch/set-model advance `updatedAt`), so the snapshot merge resolves concurrent edits last-write-wins; `deleteConversation` layers a `[chatConversations+id]` tombstone on top of `delete`.
- `index.ts` — module export surface.

## For AI Agents

### Working In This Directory

1. **Ports are types only.** No runtime code in this directory.
2. **Adding a new port = pair-edit.** Update `persistence-port.ts` aggregate, write the leaf file, add Dexie + in-memory implementations + tests in the same change.
3. **Cascade discipline.** Every per-profile repo MUST expose `deleteByProfile(profileId)`. The aggregate `transaction(fn)` is the only allowed multi-write seam.
4. **Concurrent-delete tolerance.** `delete*` methods are no-ops on missing rows by convention.
5. **No `db` import in application code.** That contract is the reason `transaction` lives on the port.

### Testing Requirements

- Port types themselves don't have tests — they're surfaced by their two implementations (Dexie under `adapters/dexie/`, in-memory under `test-utils/`).

### Common Patterns

- Composite ids are documented inline (see `coaching-repositories.ts` header comment on `getById`'s `${profileId}:${source}:${sourceId}`).

## Implementations

| Port                           | Dexie                                                     | In-memory                                                 |
| ------------------------------ | --------------------------------------------------------- | --------------------------------------------------------- |
| `PersistencePort`              | `adapters/dexie/dexie-persistence-adapter.ts`             | `test-utils/in-memory-persistence.ts`                     |
| `WorkoutRepository`            | `adapters/dexie/dexie-workout-repository.ts`              | `test-utils/in-memory-workout-repository.ts`              |
| `TemplateRepository`           | `adapters/dexie/dexie-template-repository.ts`             | `test-utils/in-memory-template-repository.ts`             |
| `ProfileRepository`            | `adapters/dexie/dexie-profile-repository.ts`              | `test-utils/in-memory-profile-repository.ts`              |
| `AiProviderRepository`         | `adapters/dexie/dexie-ai-provider-repository.ts`          | `test-utils/in-memory-ai-provider-repository.ts`          |
| `SyncStateRepository`          | `adapters/dexie/dexie-sync-state-repository.ts`           | `test-utils/in-memory-sync-state-repository.ts`           |
| `UsageEventRepository`         | `adapters/dexie/dexie-usage-event-repository.ts`          | `test-utils/in-memory-usage-event-repository.ts`          |
| `CoachingRepository`           | `adapters/dexie/dexie-coaching-repository.ts`             | `test-utils/in-memory-coaching-repository.ts`             |
| `CoachingSyncStateRepository`  | `adapters/dexie/dexie-coaching-sync-state-repository.ts`  | `test-utils/in-memory-coaching-sync-state-repository.ts`  |
| `SessionMatchRepository`       | `adapters/dexie/dexie-session-match-repository.ts`        | `test-utils/in-memory-session-match-repository.ts`        |
| `AutoMatchDismissalRepository` | `adapters/dexie/dexie-auto-match-dismissal-repository.ts` | `test-utils/in-memory-auto-match-dismissal-repository.ts` |
| `UserPreferencesRepository`    | `adapters/dexie/dexie-user-preferences-repository.ts`     | `test-utils/in-memory-user-preferences-repository.ts`     |
| `ChatMessageRepository`        | `adapters/dexie/dexie-chat-message-repository.ts`         | `test-utils/in-memory-chat-message-repository.ts`         |

## Dependencies

### Internal

- `../types/*` (the types the ports return).
- `../store/ai-store-types` (`LlmProviderConfig` — referenced by `AiProviderRepository`).

### External

- None.

<!-- MANUAL: -->

The port surface is the SPA's most-important architectural seam. Any change here forces a co-edit across both adapter implementations + every consumer use case; test coverage is the safety net.
