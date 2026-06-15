## ADDED Requirements

### Requirement: Key-only provider credential

A provider configuration SHALL be addable with only provider type, label, and API key;
the add/edit form SHALL NOT collect or require a model. `LlmProviderConfig.model` SHALL be
optional and deprecated, and no inference path SHALL depend on it — the model used for any
call SHALL come from a model binding (see "Centralized per-purpose model resolution"),
never from the credential record.

#### Scenario: Add a provider without choosing a model

- **WHEN** the user submits the add-provider form with a type, a label, and an API key
- **THEN** the provider SHALL be saved and usable for AI features without any model having
  been selected on that form

#### Scenario: Provider form exposes no model control

- **WHEN** the user opens the add-provider or edit-provider form
- **THEN** no model-selection control SHALL be rendered on that form

### Requirement: SDK-sourced model catalog

The selectable model list SHALL be generated from the installed `@ai-sdk/*` provider
packages into a committed runtime catalog (`Record<LlmProviderType, ModelOption[]>`),
filtered to chat/text-capable models, and SHALL NOT be a hand-maintained model-name enum in
application source. A CI check SHALL fail when the committed catalog differs from
regeneration against the pinned SDK. The model picker SHALL additionally accept a free-text
model id that is not present in the catalog, so models newer than the pinned SDK remain
selectable.

#### Scenario: Catalog reflects the pinned SDK

- **WHEN** the catalog generator runs against the installed `@ai-sdk/*` packages
- **THEN** the catalog SHALL list that SDK's chat-capable model ids per provider type and
  SHALL exclude non-chat models (embeddings, text-to-speech, image, moderation)

#### Scenario: Freshness guard fails on drift

- **GIVEN** the committed catalog no longer matches regeneration against the pinned SDK
- **WHEN** the catalog check runs in CI
- **THEN** the check SHALL fail and report the drift

#### Scenario: Free-text model id accepted

- **WHEN** the user enters a model id that is absent from the catalog into the model picker
- **THEN** that id SHALL be accepted and persisted as the binding's `modelId` unchanged

### Requirement: Per-profile model bindings

The system SHALL persist, per profile, a `default` model binding plus optional per-purpose
overrides for the purposes `chat` and `workout_generation`. Each binding SHALL reference a
configured provider id and a model id (`{ providerId, modelId }`). Bindings SHALL be
per-profile, SHALL cascade-delete with the profile, and SHALL be included in the cloud-sync
snapshot.

#### Scenario: Set a default model for a profile

- **WHEN** the user selects a default provider and model in the Models settings area
- **THEN** a `default` binding SHALL be persisted for the active profile and used by every
  AI purpose that has no override

#### Scenario: Override a single purpose

- **GIVEN** a `default` binding exists for the active profile
- **WHEN** the user sets a `chat` override to a different provider/model
- **THEN** chat SHALL use the override while workout generation SHALL continue to use the
  `default` binding

#### Scenario: Bindings are profile-scoped and synced

- **WHEN** a profile is deleted, or a cloud-sync snapshot export runs
- **THEN** that profile's bindings SHALL be removed by the per-profile cascade, and an
  exported snapshot SHALL contain the `aiModelBindings` rows for merge on other devices

### Requirement: Centralized per-purpose model resolution

All AI features SHALL obtain their provider and model through a single
`resolveModelForPurpose(profileId, purpose, providers, bindings)` function with the fallback
order: the purpose's own binding → the `default` binding → the `isDefault` provider (or the
first provider) paired with the catalog's default model for that provider type → none. A
binding whose referenced provider no longer exists SHALL be skipped. The chat feature SHALL
resolve the `chat` purpose; free-text generation, coaching-activity conversion, and batch
processing SHALL resolve the `workout_generation` purpose.

#### Scenario: Purpose override wins

- **GIVEN** a `chat` override binding exists whose provider is configured
- **WHEN** chat resolves its model
- **THEN** the resolver SHALL return that override's provider and model id

#### Scenario: Fall back to the default binding

- **GIVEN** no `chat` override exists but a `default` binding does
- **WHEN** chat resolves its model
- **THEN** the resolver SHALL return the `default` binding's provider and model id

#### Scenario: Fall back to the default provider and catalog model

- **GIVEN** no bindings exist for the profile but at least one provider is configured
- **WHEN** any purpose resolves its model
- **THEN** the resolver SHALL return the `isDefault` provider (or the first provider) paired
  with the catalog's default model for that provider type

#### Scenario: Binding referencing a deleted provider is skipped

- **GIVEN** a purpose binding references a provider id that is no longer configured
- **WHEN** that purpose resolves its model
- **THEN** the resolver SHALL skip the stale binding and continue down the fallback order

#### Scenario: No providers configured

- **WHEN** a purpose resolves its model and zero providers are configured
- **THEN** the resolver SHALL return none and the feature SHALL show its existing
  "no provider configured" empty state
