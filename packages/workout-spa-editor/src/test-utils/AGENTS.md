<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/test-utils/`

## Purpose

In-memory port implementations + console-spy + fixture loaders. The seam tests use to run application-layer use cases without a real Dexie. Mirrors every repository under `src/adapters/dexie/` with a deterministic in-memory equivalent.

## Key Files

### In-memory repositories (mirror `adapters/dexie/`)

- `in-memory-persistence.ts` / `.test.ts` + `in-memory-persistence-snapshot.ts` — `createInMemoryPersistence()` factory returning a full `PersistencePort` (with snapshot/revert backing the `transaction(fn)` boundary).
- `in-memory-workout-repository.ts` — `WorkoutRepository`.
- `in-memory-template-repository.ts` — `TemplateRepository`.
- `in-memory-profile-repository.ts` — `ProfileRepository`.
- `in-memory-ai-provider-repository.ts` — `AiProviderRepository`.
- `in-memory-sync-state-repository.ts` — `SyncStateRepository`.
- `in-memory-usage-event-repository.ts` — `UsageEventRepository`.
- `in-memory-coaching-repository.ts` / `.test.ts` — `CoachingRepository`.
- `in-memory-coaching-sync-state-repository.ts` / `.test.ts` — `CoachingSyncStateRepository`.
- `in-memory-session-match-repository.ts` / `.test.ts` + `in-memory-session-match-{append-executed,conflicts,readers}.ts` — `SessionMatchRepository` split into focused files per file-size cap.
- `in-memory-auto-match-dismissal-repository.ts` / `.test.ts` — `AutoMatchDismissalRepository`.
- `in-memory-user-preferences-repository.ts` / `.test.ts` — `UserPreferencesRepository`.

### Console spy

- `console-spy.ts` / `.test.ts` + `console-spy.example.test.tsx` — `expectNoReactWarnings`, `setupConsoleErrorSpy`, `expectNoConsoleErrors`, `expectNoReactPropWarnings` (see `README.md`).

### Fixtures + canonical inputs

- `application-fixtures.ts` — canonical inputs for application-layer tests.
- `fixtures.ts` / `.test.ts` — fixture-loading helpers (delegates to `@kaiord/core/test-utils`).
- `zone-fixtures.ts` — canonical zone configurations.
- `mock-download.ts` — stubs the browser `<a download>` flow used by `backup-download.ts`.

### Module surface

- `index.ts` — public exports (`@kaiord/workout-spa-editor` is private but `@/test-utils` is the SPA-internal alias).
- `README.md` — usage guide for the console-spy + fixture helpers.

## For AI Agents

### Working In This Directory

1. **In-memory adapters MUST satisfy the same port type as the Dexie adapter.** A behavior covered by the Dexie repo test must also be covered by the in-memory repo test — drift is a CI risk.
2. **`createInMemoryPersistence()` is the canonical entry** for application-layer tests. Don't wire individual repos by hand unless you specifically need to swap one.
3. **`transaction(fn)` semantics matter.** The in-memory impl snapshots before `fn` and reverts on throw. Tests of multi-write atomicity rely on this.

### Testing Requirements

- Each in-memory repo has a co-located `.test.ts` matching the port contract.
- Console-spy helpers have example tests pinning the API surface.

### Common Patterns

- Factory exports (`createInMemoryX`); never default exports.
- Snapshot/revert in `in-memory-persistence-snapshot.ts` is the one place the test seam knows about all repos at once.

## Dependencies

### Internal

- `../ports/*`.
- `../types/*`.

### External

- None (pure data structures).

<!-- MANUAL: -->

When you add a new port, mirror it here in the same commit. The in-memory implementation is the test seam every consumer relies on; a missing mirror means application tests have to spin up Dexie + fake-indexeddb just to exercise a single use case.
