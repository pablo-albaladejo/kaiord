# Design: Per-Use Model Selection with SDK-Sourced Model Catalog

## Context

The SPA is browser-only (no backend; BYOK). AI provider credentials live in the global
Dexie `aiProviders` table as `LlmProviderConfig { id, type, apiKey, model, label,
isDefault, createdAt }` — the model is **bundled with the key**. Model names are a
**hardcoded enum** in `src/lib/provider-models.ts`. Four call sites consume a model, each
with its own divergent provider-resolution fallback (chat, free-text generation, coaching
conversion, batch). The single SDK seam is `createLanguageModel(config)` in
`src/lib/provider-factory.ts`, which calls `provider(config.model)`.

Two hard constraints shape the design (verified in the deep-dive trace):

- **CORS**: A browser `fetch` of the provider "list models" endpoint works only for
  Anthropic (via the `anthropic-dangerous-direct-browser-access` header already sent).
  OpenAI and Google return no `Access-Control-Allow-Origin` and offer no opt-in.
- **SDK ids are type-level**: `@ai-sdk/*` expose `*ModelId` as TypeScript unions only — no
  runtime registry and no `listModels()` helper.

## Goals / Non-Goals

**Goals:**

- Add a provider with key only; choose model per use; persist per-profile selections.
- Stop hardcoding model names in app source; track them from the pinned SDK.
- One consistent model-resolution path for all AI features.

**Non-Goals:**

- No backend/proxy/Gateway; no live `/models` calls (incl. Anthropic) in this change.
- No change to `@kaiord/ai` inference factories (they take a built `LanguageModel`).
- No model metadata (pricing/context window) UI; no per-call-site (4-way) overrides yet.

## Decisions

### D1 — Model catalog generated from the installed SDK (not live, not hand-written)

`scripts/generate-model-catalog.mjs` parses the installed `@ai-sdk/anthropic|openai|google`
type declarations, extracts the `*ModelId` union literals, filters to chat/text models,
and emits `src/lib/generated/model-catalog.ts` as
`Record<LlmProviderType, ModelOption[]>`. `scripts/check-model-catalog.mjs` (run by
`pnpm test:scripts` + CI) regenerates into memory and fails on drift. The picker renders
the catalog **plus** a free-text "custom model id" input for ids newer than the pin.

- _Layer:_ tooling + `src/lib` (presentation-support). No port.
- _Alternatives:_ (a) live `/v1/models` — rejected: CORS-blocked for OpenAI/Google, partial
  UX, network dependency. (b) hand-maintained enum — rejected: the status quo that drifts.
  (c) import a runtime list from the SDK — impossible: unions are compile-time only.

### D2 — `createLanguageModel(credential, modelId)` seam split

Change the factory from `(config: LlmProviderConfig)` to
`(credential: {type, apiKey}, modelId: string)`. The model is supplied by the caller via
the resolver, never read from the credential record.

- _Layer:_ `src/lib` adapter-facing helper. Single call-site contract; the four consumers
  pass the resolved `modelId`.
- _Alternative:_ keep `(config)` and mutate `config.model` before calling — rejected: keeps
  the coupling and the mutable surprise.

### D3 — `AiModelBindingRepository` port + per-profile `aiModelBindings` table (Dexie v22)

New port interface on `PersistencePort` (defined before adapters per hexagonal rule):

```ts
type AiModelPurpose = "default" | "chat" | "workout_generation";
type AiModelBinding = {
  profileId: string;
  purpose: AiModelPurpose;
  providerId: string;
  modelId: string;
  updatedAt: number;
};
type AiModelBindingRepository = {
  getAll(profileId: string): Promise<AiModelBinding[]>;
  get(
    profileId: string,
    purpose: AiModelPurpose
  ): Promise<AiModelBinding | undefined>;
  put(binding: AiModelBinding): Promise<void>;
  delete(profileId: string, purpose: AiModelPurpose): Promise<void>;
};
```

Dexie schema: `aiModelBindings: "[profileId+purpose], profileId"`. PK starts with
`profileId` ⇒ auto-discovered by `isPerProfileTable` for cascade delete, and exported by
the blanket snapshot scan ⇒ auto cross-device sync. Dexie + in-memory adapters mirror the
existing `ChatMessageRepository` pattern.

- _Alternatives:_ (a) global `meta` KV — rejected: not per-profile, not typed, manual sync
  membership. (b) extend `userPreferences` — rejected: conflates AI config with calendar/UI
  prefs and bloats one row. (c) global table — rejected: user chose per-profile scope.

### D4 — Binding references `{ providerId, modelId }`, not `modelId` alone

A user can configure two providers of the same type; a bare model id is ambiguous about
which credential to use. The binding pins a specific `providerId`.

- The resolver tolerates a deleted provider by falling through to the next step.

### D5 — Centralized `resolveModelForPurpose()` (application layer)

`src/application/ai/resolve-model-for-purpose.ts`, pure over (purpose, providers, bindings):

1. binding `(profileId, purpose)` whose provider still exists → `{ provider, modelId }`.
2. else binding `(profileId, "default")` whose provider exists → use it.
3. else `isDefault` provider (or `providers[0]`) + catalog default model for its type.
4. else `null`.
   All four consumers call this; purpose mapping: chat→`chat`; free-text gen, coaching
   conversion, batch→`workout_generation`. This removes the four divergent chains (including
   the `providers[0]`-instead-of-`isDefault` inconsistency in coaching).

- _Layer:_ application (pure function, unit-testable, no I/O).

### D6 — Relax `LlmProviderConfig.model` to optional/deprecated

Keep the field one release for the migration and any missed reader; the add/edit form and
resolver stop using it. A follow-up change removes it.

## Risks / Trade-offs

- **Generated catalog drifts from the SDK** → CI freshness guard (`check-model-catalog`)
  fails; `generate:model-catalog` regenerates. Generator has its own `node:test`.
- **SDK `.d.ts` shape changes between versions break the parser** → guard catches it at the
  SDK bump; the free-text field keeps the app usable; the generator is pinned-version-tested.
- **A stored `modelId` is absent from the catalog** (older/newer pin) → resolver uses the
  stored `modelId` verbatim regardless of catalog membership; the picker shows it via the
  free-text path. No silent reset.
- **Provider referenced by a binding is deleted** → resolver step 1/2 checks existence and
  falls through; no crash, no stale call.
- **A reader of `provider.model` is missed** → field kept optional one release; an exhaustive
  grep of `\.model` on provider objects is part of tasks; `AiMeta.model` (audit) is written
  from the resolved `modelId`, not the credential.
- **Backfill across multiple profiles with global providers** → seed each profile's
  `default` binding from the global `isDefault` provider + its `model`; profiles with no
  providers get no binding (resolver returns null, same as today's empty state).

## Migration Plan

1. Ship Dexie **v22**: add `aiModelBindings`; `upgrade()` reads existing providers, and for
   each profile writes a `default` binding `{ providerId: <isDefault or providers[0]>.id,
modelId: <that provider>.model }` when a model exists. Idempotent (keyed by
   `[profileId+purpose]`).
2. `LlmProviderConfig.model` becomes optional; form/resolver stop writing/reading it.
3. **Rollback:** v22 is additive; older code still reads `provider.model` (retained), so a
   downgrade keeps working — the new table is simply ignored.
4. Follow-up (separate change): remove `LlmProviderConfig.model` and the dead readers.

## Open Questions

- Should the override set later expand from 2 purposes to the full 4 call sites? Deferred;
  the `purpose` key makes it additive.
- Future enhancement: optional live Anthropic `/v1/models` "refresh" button layered on the
  catalog. Out of scope here.
