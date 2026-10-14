> Synced: 2026-10-15 (ai-settings-truth)

# spa-ai-model-selection Specification

## Purpose

Per-use AI model selection for the workout SPA: provider credentials are stored
key-only, and each AI purpose (default, chat, workout generation) binds to a
specific provider + model per profile. Selectable models come from an
SDK-sourced catalog generated from the installed `@ai-sdk/*` packages (with a
free-text override for ids newer than the pinned SDK), and a single
`resolveModelForPurpose()` is the shared resolution path for chat, free-text
generation, coaching conversion, and batch processing.

## Requirements

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

### Requirement: Per-profile model bindings

The system SHALL persist, per profile, a `default` model binding plus optional per-purpose
overrides for the purposes `chat`, `workout_generation` and `lab_extraction`. Each binding
SHALL reference a configured provider id and a non-blank model id (`{ providerId, modelId }`);
`setModelBinding` SHALL reject a blank or whitespace-only model id and store nothing.
Bindings SHALL be per-profile, SHALL cascade-delete with the profile, and SHALL be included
in the cloud-sync snapshot. Removing a provider SHALL delete every profile's bindings that
reference it, so no binding outlives its provider.

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

#### Scenario: A blank model is rejected

- **WHEN** `setModelBinding` is called with a model id that is empty or only whitespace
- **THEN** it SHALL reject with `EmptyModelIdError` and no binding SHALL be stored

#### Scenario: Removing a provider removes its bindings

- **GIVEN** two profiles hold bindings that reference provider P, and one holds a binding to
  another provider
- **WHEN** provider P is removed
- **THEN** every binding referencing P SHALL be deleted and the other binding SHALL remain

### Requirement: Centralized per-purpose model resolution

All AI features SHALL obtain their provider and model through the single
`resolveModelForPurpose(purpose, providers, bindings)` function exported by
`@kaiord/ai/providers`, with the fallback order: the purpose's own binding → the `default`
binding → the `isDefault` provider (or the first provider) paired with that provider's
stored model if present, otherwise the catalog's default model for its type → none. A
binding whose referenced provider no longer exists SHALL be skipped. A binding whose model id
is blank SHALL keep its provider and resolve to that provider's model (its stored model, else
the catalog default), so bindings stored blank before blank ids were rejected run a real
model. The chat feature SHALL resolve the `chat` purpose; free-text generation,
coaching-activity conversion, and batch processing SHALL resolve the `workout_generation`
purpose.

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

#### Scenario: A blank bound model is healed

- **GIVEN** a `chat` binding references an OpenAI provider with `modelId: ""`
- **WHEN** chat resolves its model
- **THEN** the resolver SHALL return that provider with the catalog's default OpenAI model

#### Scenario: No providers configured

- **WHEN** a purpose resolves its model and zero providers are configured
- **THEN** the resolver SHALL return none and the feature SHALL show its existing
  no-provider empty state

#### Scenario: Resolution is imported from the package

- **WHEN** any SPA feature module resolves a model for a purpose
- **THEN** the resolver SHALL be imported from `@kaiord/ai/providers`, and no copy of the
  resolution algorithm SHALL remain in SPA source

### Requirement: AI settings show the effective model and one main model

The athlete's main model SHALL be their `default` binding; the AI settings SHALL offer no
provider-level default (no "Default" badge, no "Set Default" action), and `isDefault` SHALL
remain only the resolver's fallback. Every model row SHALL be one select that chooses the
account and its model together (one option group per account, plus a custom id entry that
commits only a non-blank id), and SHALL display the effective resolution from
`resolveModelForPurpose`, never the first provider or the first catalog option. A purpose
without its own binding SHALL display "Same as main model (<model> · <account>)", and
choosing that option SHALL clear the purpose's binding. The Settings index SHALL name the
account the athlete's main model runs on.

#### Scenario: Rows show what runs before any choice

- **GIVEN** two accounts and no bindings, where the second carries `isDefault`
- **WHEN** the AI settings render
- **THEN** the main-model select SHALL show the second account with its model, and the chat
  select SHALL show that it follows the main model, naming that model and account

#### Scenario: A stored blank model is shown as what runs

- **GIVEN** a `chat` binding stored with `modelId: ""`
- **WHEN** the AI settings render
- **THEN** the chat select SHALL show the bound account's model, not a blank or first option

#### Scenario: Account and model are chosen together

- **WHEN** the athlete picks an option in a model select
- **THEN** the binding SHALL be written with that option's account and model in one write,
  and no write SHALL carry a blank model

### Requirement: Provider keys are not shown back and removal is confirmed

A provider row SHALL show only the last four characters of its key behind a mask. The edit
form SHALL open its key field empty and SHALL keep the stored key when the field is left
empty; the stored key SHALL never be rendered into the DOM. Removing a provider SHALL ask
for confirmation naming the provider, and cancelling SHALL keep it.

#### Scenario: The key is masked

- **GIVEN** a provider whose key ends in `abcd`
- **WHEN** its row renders, and when its edit form opens
- **THEN** the row SHALL show `••••abcd`, the key field SHALL be empty, and the full key SHALL
  appear nowhere in the page

#### Scenario: Removal is confirmed

- **WHEN** the athlete presses Remove on a provider
- **THEN** a dialog SHALL ask to confirm, and the provider SHALL be removed only on confirm
