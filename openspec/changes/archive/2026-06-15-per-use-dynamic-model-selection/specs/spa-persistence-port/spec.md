## ADDED Requirements

### Requirement: AiModelBindingRepository

`PersistencePort` SHALL expose an `AiModelBindingRepository` for per-profile model bindings
with operations to put a binding, get one binding by `(profileId, purpose)`, list all
bindings for a profile, and delete one binding. Records are profile-scoped
(`{ profileId, purpose, providerId, modelId, updatedAt }`) where `purpose` is one of
`default | chat | workout_generation`, keyed by the compound `[profileId+purpose]` so each
purpose has at most one binding per profile. The store SHALL participate in the per-profile
cascade delete and SHALL be included in the cloud-sync snapshot export. Stores and use cases
SHALL depend on the port interface, never on the Dexie table directly.

#### Scenario: One binding per purpose per profile

- **WHEN** a binding for `(profile A, chat)` is put twice with different `modelId` values
- **THEN** the repository SHALL retain a single `(profile A, chat)` row reflecting the latest
  put

#### Scenario: List bindings per profile

- **WHEN** bindings exist for profiles A and B and the Models settings reads profile A's
  bindings
- **THEN** the repository SHALL return only profile A's bindings

#### Scenario: Cascade delete on profile removal

- **WHEN** a profile is deleted
- **THEN** that profile's model bindings SHALL be removed by the same cascade that covers the
  other per-profile stores

#### Scenario: Bindings included in cloud-sync snapshot

- **WHEN** a cloud-sync snapshot export runs on a device with model bindings
- **THEN** the exported snapshot SHALL contain the `aiModelBindings` rows so they merge on
  other devices

### Requirement: Dexie v22 migration

The Dexie schema SHALL add version 22 introducing the `aiModelBindings` store with compound
primary key `[profileId+purpose]` and index `profileId`. The migration SHALL be additive for
existing stores and SHALL backfill a `default` binding for each profile that has at least one
configured provider, seeded from that profile's `isDefault` provider (or the first provider)
and that provider's existing `model`, so AI features behave identically immediately after
upgrade. The backfill SHALL be idempotent.

#### Scenario: Fresh install at v22

- **WHEN** the SPA initializes IndexedDB on a device with no prior database
- **THEN** the database SHALL open at version 22 with the `aiModelBindings` store present and
  all pre-existing stores unchanged

#### Scenario: Upgrade backfills the default binding

- **GIVEN** a pre-v22 database with at least one configured provider carrying a `model`
- **WHEN** the device loads the new build
- **THEN** the database SHALL upgrade to v22 and SHALL contain a `default` binding seeded from
  the existing default provider's id and model, while preserving all other stores' rows

#### Scenario: Upgrade with no providers adds an empty store

- **GIVEN** a pre-v22 database with zero configured providers
- **WHEN** the device loads the new build
- **THEN** the database SHALL upgrade to v22 with an empty `aiModelBindings` store and no
  binding rows

### Requirement: InMemoryAiModelBindingRepository

The in-memory persistence adapter SHALL implement `AiModelBindingRepository` with the same
observable behavior so model-binding use cases and components are unit-testable without
IndexedDB.

#### Scenario: Unit test with model-binding persistence

- **WHEN** a use-case test puts and reads bindings through the in-memory adapter
- **THEN** the results SHALL match the Dexie adapter's contract (profile scoping, one row per
  `(profileId, purpose)`, delete semantics)
