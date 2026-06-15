# Proposal: Per-Use Model Selection with SDK-Sourced Model Catalog

## Why

Today, configuring an AI provider at `/settings/ai` forces the user to also pick a
model from a **hardcoded enum** (`src/lib/provider-models.ts`) that bundles the model
into the provider credential record (`LlmProviderConfig.model`). This couples the API
key to a single model, hardcodes model names that go stale on every provider release,
and gives every feature the same model. Users want to add **just a key** and then choose
**which model each feature uses** — one model for chat, another for workout generation —
without the app's source carrying a list of model names that constantly drifts.

## What Changes

- **Add-provider becomes key-only.** The provider add/edit form collects type + label +
  API key. `LlmProviderConfig.model` is relaxed to optional/deprecated (kept one release
  for migration; not indexed, so no index change). **BREAKING** for the provider record
  shape, mitigated by a v22 backfill (below).
- **Per-profile model bindings.** A new Dexie table `aiModelBindings` (schema **v22**,
  PK `[profileId+purpose]`) stores one `default` binding plus optional overrides for two
  purposes: `chat` and `workout_generation`. Each binding is `{ providerId, modelId }`.
  Per-profile ⇒ it auto-cascades on profile delete and auto-rides the Google-Drive
  snapshot (blanket `db.tables` export) with no sync wiring.
- **One centralized resolver.** `resolveModelForPurpose(profileId, purpose, …)` replaces
  the four divergent provider-resolution chains in chat, free-text generation, coaching
  conversion, and batch (one of which incorrectly falls back to `providers[0]` instead of
  `isDefault`). Fallback: purpose binding → `default` binding → default provider + catalog
  default model → none.
- **SDK-sourced model catalog.** A generator (`scripts/generate-model-catalog.mjs`)
  extracts model ids from the installed `@ai-sdk/anthropic|openai|google` packages into a
  runtime `src/lib/generated/model-catalog.ts`, replacing the hardcoded `PROVIDER_MODELS`
  enum. A CI freshness guard fails on drift from the pinned SDK. The picker shows the
  catalog plus a free-text field for ids newer than the pinned SDK. (No live `/models`
  API calls — verified browser-CORS-blocked for OpenAI/Google; see design.)
- **New Settings "Models" area** (per active profile): default model picker + Chat and
  Workout-generation override rows.
- **v22 backfill** seeds each existing profile's `default` binding from its current
  default provider's `model`, so behavior is unchanged on upgrade.

## Capabilities

### New Capabilities

- `spa-ai-model-selection`: provider credential management as **key-only**; the
  SDK-sourced model catalog (generation + freshness guard + free-text override); the
  per-profile model-binding model (default + per-purpose overrides) and its purpose
  taxonomy; and the centralized `resolveModelForPurpose()` resolution contract used by
  all AI features.

### Modified Capabilities

- `spa-ai-chat`: the **Provider reuse** requirement changes — the conversation's model is
  resolved via the `chat` purpose binding (falling back through the resolver) rather than
  the provider's bundled `model`; mid-conversation provider switching is preserved.
- `spa-persistence-port`: add an `AiModelBindingRepository` to `PersistencePort`, a
  `Dexie v22 migration` (new `aiModelBindings` table + default-binding backfill), and the
  in-memory counterpart; relax `LlmProviderConfig.model` to optional.

## Impact

- **Package:** `@kaiord/workout-spa-editor` only (SPA). No `@kaiord/*` library or public
  API change; `@kaiord/ai` inference factories are unchanged (they already take a built
  `LanguageModel`).
- **Hexagonal layers:** types (`ai-store-types`, new binding/purpose types) → ports
  (`persistence-port` / `simple-repositories`) → adapters (Dexie schema v22 + repository +
  in-memory) → application (`resolve-model-for-purpose`, binding use-cases) → hooks/
  components (Settings Models area, provider form, the four consumer call sites).
- **New I/O port first:** `AiModelBindingRepository` interface defined before its Dexie
  and in-memory adapters.
- **Tooling:** new `scripts/generate-model-catalog.mjs` + `scripts/check-model-catalog.mjs`
  (wired into `pnpm test:scripts`); new `generate:model-catalog` package script. No new
  publishable package, so no changeset-config / release-workflow updates needed.
- **Removed:** hardcoded `PROVIDER_MODELS` enum in `src/lib/provider-models.ts`.
- **Migration:** Dexie v21 → v22, additive + backfill; existing users unaffected.
