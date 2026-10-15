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

A provider configuration SHALL be addable with only provider type and API key; the label
SHALL be optional, and a blank label SHALL become the provider's name ("Anthropic"),
numbered from 2 when an account already carries it ("Anthropic 2"). A typed or renamed label
another account already carries SHALL be numbered the same way ("Work 2"), so no two
accounts share a label. The API key SHALL be stored without surrounding whitespace. The add/edit form SHALL
NOT collect or require a model. `LlmProviderConfig.model` SHALL be optional and deprecated,
and no inference path SHALL depend on it — the model used for any call SHALL come from a
model binding (see "Centralized per-purpose model resolution"), never from the credential
record. The outcome of the key check SHALL be stored with the account as `keyCheck`
(`valid` or `unverified`) whenever a key is saved.

#### Scenario: Add a provider without choosing a model

- **WHEN** the user submits the add-provider form with a type and an API key
- **THEN** the provider SHALL be saved and usable for AI features without any model having
  been selected on that form

#### Scenario: Provider form exposes no model control

- **WHEN** the user opens the add-provider or edit-provider form
- **THEN** no model-selection control SHALL be rendered on that form

#### Scenario: A blank label takes the provider's name

- **GIVEN** an Anthropic account labelled "Anthropic" exists
- **WHEN** the user adds two more Anthropic accounts without a label
- **THEN** they SHALL be labelled "Anthropic 2" and "Anthropic 3"

#### Scenario: A taken label is numbered

- **GIVEN** an account labelled "Work" exists
- **WHEN** the user adds an account labelled "Work", or renames another account to "Work"
- **THEN** that account SHALL be labelled "Work 2"

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
`resolveModelForPurpose`, never the first provider or the first catalog option. Models SHALL
be named by `modelDisplayName` from `@kaiord/ai/providers` ("Claude Sonnet 5", "GPT-5 mini"),
and the options SHALL come from `listedModels`, which leaves out a dated snapshot whose alias
is listed; a running model outside that list SHALL still be shown, by name and date. A
purpose without its own binding SHALL display "Same as main model (<model> · <account>)", and
choosing that option SHALL clear the purpose's binding. The Settings index SHALL name the
athlete's main model. The workout generator's model select SHALL be the same select for the
`workout_generation` purpose: it SHALL show what generation runs, and a choice there SHALL be
stored as the athlete's `workout_generation` binding.

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

#### Scenario: The generator shows and stores the model generation runs

- **GIVEN** an athlete whose main model runs on an account without `isDefault`
- **WHEN** the workout generator's model select renders
- **THEN** it SHALL show that main model and account, not the `isDefault` account
- **AND** choosing another model there SHALL store the `workout_generation` binding, which
  the AI settings then show

#### Scenario: Models are listed once, by name

- **WHEN** a model select lists an Anthropic account's models
- **THEN** it SHALL offer "Claude Haiku 4.5" once and SHALL NOT offer
  `claude-haiku-4-5-20251001`
- **AND** an athlete whose stored model is `claude-haiku-4-5-20251001` SHALL see it selected
  as "Claude Haiku 4.5 (2025-10-01)"

### Requirement: Provider keys are not shown back and removal is confirmed

A provider row SHALL show only the last four characters of its key behind a mask, and only
the mask when the key is four characters or shorter, next to the key status: "verified" when
the provider accepted the key, "not checked" when it could not be reached or the check was
never recorded, and "missing" when the account has no key. "Replace key" SHALL open an empty
key field, and the stored key SHALL never be rendered into the DOM. Renaming and removing
SHALL live in the row's overflow menu; removing SHALL ask for confirmation naming the
provider, and cancelling SHALL keep it.

#### Scenario: The key is masked

- **GIVEN** a provider whose key ends in `abcd`
- **WHEN** its row renders, and when its key is being replaced
- **THEN** the row SHALL show `••••abcd`, the key field SHALL be empty, and the full key SHALL
  appear nowhere in the page

#### Scenario: A short key shows only the mask

- **GIVEN** a provider whose whole key is `abcd`
- **WHEN** its row renders
- **THEN** the row SHALL show `••••` and `abcd` SHALL appear nowhere in the page

#### Scenario: Removal is confirmed

- **WHEN** the athlete chooses Remove in a provider's overflow menu
- **THEN** a dialog SHALL ask to confirm, and the provider SHALL be removed only on confirm

#### Scenario: The key status is stated

- **GIVEN** an account whose key the provider could not be reached to check
- **WHEN** its row renders, after a reload
- **THEN** the row SHALL say the key was not checked

### Requirement: AI settings lead with the athlete's assistant

The AI settings SHALL open with a card titled "Your assistant (for <athlete>)" naming the
active athlete's main model, the account it runs on, that account's key status, and this
month's AI use (requests, tokens, estimated cost) — labelled as the total for every athlete,
since usage is not recorded per athlete — with the main-model select. The usage table's
title SHALL say it covers every athlete too. The card and the usage
table SHALL format costs the same way, as US dollars in the reader's locale. The accounts
SHALL follow under "AI accounts", stated as shared by every athlete; the add form SHALL be
shown only after "Add account" is pressed, SHALL close once the key is stored, and SHALL
reopen blank. The per-task models SHALL sit under "Advanced: model per task (for <athlete>)",
collapsed while every task follows the main model and open as soon as one has its own. The
custom instructions SHALL be saved after a pause in typing or when the field is left, never
on each keystroke, and SHALL say whether they were saved: "Saved ✓" only once nothing newer
waits to be saved, and a failed save SHALL be retried when the field is left again. Opening
the add form SHALL put the focus on the provider choice, and confirming a removal SHALL leave
the focus on "Add account". On a 390px-wide screen no part of an account row SHALL overflow it
or run beneath its buttons, and the usage table SHALL fit the screen.

#### Scenario: The assistant card states what the athlete uses

- **GIVEN** the athlete Ana whose main model is Claude Opus 5 on "Mi Claude", whose key was
  verified, and two AI runs this month
- **WHEN** the AI settings render
- **THEN** the card SHALL read "Your assistant (for Ana)", name "Claude Opus 5" on
  "Mi Claude" with "Key verified", and sum the two runs' tokens and cost as the total for
  every athlete

#### Scenario: The add form closes and reopens blank

- **WHEN** the athlete adds an OpenAI account whose key cannot be checked
- **THEN** the form SHALL close, and reopening it SHALL show the first provider type, empty
  fields and no message from the previous add

#### Scenario: Per-task models open when one is set

- **GIVEN** the athlete has a `lab_extraction` binding of its own
- **WHEN** the AI settings render
- **THEN** the "Advanced: model per task" section SHALL be open

#### Scenario: Instructions are not written per keystroke

- **WHEN** the athlete types into the custom instructions and leaves the field
- **THEN** no write SHALL happen while typing, one write SHALL happen on leaving, and
  "Saved ✓" SHALL be shown
