> Synced: 2026-04-17

# SPA Persistence Port

## Requirements

### Requirement: PersistencePort interface

The system SHALL define a PersistencePort interface with repository types for workouts, templates, profiles, AI providers, sync state, and usage tracking. Stores and use cases SHALL depend on the port interface, never on Dexie directly.

#### Scenario: Store uses PersistencePort

- **WHEN** any application code needs to read or write persisted data
- **THEN** it SHALL call methods on PersistencePort repositories, not Dexie tables directly

### Requirement: DexiePersistenceAdapter

The system SHALL provide a DexiePersistenceAdapter that implements PersistencePort using Dexie.js over IndexedDB. The adapter SHALL define a Dexie schema starting at version 1 with indexes on `[date]`, `[date+state]`, `[source+sourceId]`, `sport`, and `*tags` (multiEntry).

#### Scenario: Calendar week query

- **WHEN** the calendar requests workouts for a date range
- **THEN** the WorkoutRepository SHALL query using the `[date]` index and return all workouts within the range

#### Scenario: Dexie schema versioning

- **WHEN** the schema needs to change in a future release
- **THEN** the adapter SHALL use `db.version(N).stores({}).upgrade()` pattern to migrate existing data

### Requirement: InMemoryPersistenceAdapter

The system SHALL provide an InMemoryPersistenceAdapter for use in tests. It SHALL be located in `src/test-utils/in-memory-persistence.ts` and implement the same PersistencePort interface.

#### Scenario: Unit test with persistence

- **WHEN** a test needs to verify store behavior with persistence
- **THEN** it SHALL inject InMemoryPersistenceAdapter, which stores data in plain arrays/maps with no async latency

### Requirement: Storage degradation handling

The system SHALL probe IndexedDB availability on boot. If unavailable, the system SHALL fall back to in-memory operation with user-visible warnings.

#### Scenario: IndexedDB unavailable (private browsing)

- **WHEN** the Dexie probe write/read fails on app boot
- **THEN** the system SHALL display a persistent banner "Storage unavailable — changes in this session won't be saved", fall back to in-memory persistence, and make export buttons more prominent

### Requirement: AI provider encryption preservation

The AiProviderRepository SHALL preserve encryption for API keys. API keys SHALL never be stored in plaintext in any Dexie table.

#### Scenario: Save AI provider config

- **WHEN** an AI provider with an API key is saved via AiProviderRepository
- **THEN** the API key SHALL be encrypted before storage using the existing `createSecureStorage` mechanism or equivalent

### Requirement: Workout-store persistence boundary

The workout-store (Zustand) SHALL persist to Dexie only on explicit user actions (save to library, push to Garmin), never via automatic write-through. The workout-store is editor runtime state, not persisted data.

#### Scenario: User edits a workout in the editor

- **WHEN** the user modifies steps, reorders, or uses undo/redo in the editor
- **THEN** changes SHALL remain in Zustand in-memory state only, with no Dexie writes

#### Scenario: User saves workout to library

- **WHEN** the user clicks "Save to Library" from the editor
- **THEN** the system SHALL write the current KRD to the templates table via TemplateRepository
