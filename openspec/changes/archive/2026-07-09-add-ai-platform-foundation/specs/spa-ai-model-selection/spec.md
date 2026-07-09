## MODIFIED Requirements

### Requirement: SDK-sourced model catalog

The selectable model list SHALL be generated from the installed `@ai-sdk/*` provider
packages into a committed runtime catalog (`Record<LlmProviderType, ModelOption[]>`),
filtered to chat/text-capable models, and SHALL NOT be a hand-maintained model-name enum in
application source. The catalog, its generator, its type-union extractor, and its freshness
guard SHALL live in `packages/ai` and be exported to the SPA via `@kaiord/ai/providers`. A
CI check SHALL fail when the committed catalog differs from regeneration against the pinned
SDK. The model picker SHALL additionally accept a free-text model id that is not present in
the catalog, so models newer than the pinned SDK remain selectable.

#### Scenario: Catalog reflects the pinned SDK

- **WHEN** the catalog generator runs against the installed `@ai-sdk/*` packages
- **THEN** the catalog SHALL list that SDK's chat-capable model ids per provider type and
  SHALL exclude non-chat models (embeddings, text-to-speech, image, moderation)

#### Scenario: Freshness guard fails on drift

- **GIVEN** the committed catalog no longer matches regeneration against the pinned SDK
- **WHEN** the catalog check runs in CI (now as part of the `packages/ai` suite)
- **THEN** the check SHALL fail and report the drift

#### Scenario: Free-text model id accepted

- **WHEN** the user enters a model id that is absent from the catalog into the model picker
- **THEN** that id SHALL be accepted and persisted as the binding's `modelId` unchanged

#### Scenario: SPA consumes the catalog through the package

- **WHEN** the SPA model picker lists selectable models
- **THEN** the catalog data SHALL be imported from `@kaiord/ai/providers`, and no generated
  catalog artifact SHALL exist under `packages/workout-spa-editor/src/`

### Requirement: Centralized per-purpose model resolution

All AI features SHALL obtain their provider and model through the single
`resolveModelForPurpose(purpose, providers, bindings)` function exported by
`@kaiord/ai/providers`, with the fallback order: the purpose's own binding → the `default`
binding → the `isDefault` provider (or the first provider) paired with that provider's
stored model if present, otherwise the catalog's default model for its type → none. A
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

#### Scenario: Fall back to the default provider and its model

- **GIVEN** no bindings exist for the profile but at least one provider is configured
- **WHEN** any purpose resolves its model
- **THEN** the resolver SHALL return the `isDefault` provider (or the first provider) paired
  with that provider's stored model if present, otherwise the catalog's default model for its
  type

#### Scenario: Binding referencing a deleted provider is skipped

- **GIVEN** a purpose binding references a provider id that is no longer configured
- **WHEN** that purpose resolves its model
- **THEN** the resolver SHALL skip the stale binding and continue down the fallback order

#### Scenario: No providers configured

- **WHEN** a purpose resolves its model and zero providers are configured
- **THEN** the resolver SHALL return none and the feature SHALL show its existing
  no-provider empty state

#### Scenario: Resolution is imported from the package

- **WHEN** any SPA feature module resolves a model for a purpose
- **THEN** the resolver SHALL be imported from `@kaiord/ai/providers`, and no copy of the
  resolution algorithm SHALL remain in SPA source
