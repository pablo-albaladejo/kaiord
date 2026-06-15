## 1. Types & port contract

- [x] 1.1 Add `AiModelPurpose` (`"default" | "chat" | "workout_generation"`) and
      `AiModelBinding` (`{ profileId, purpose, providerId, modelId, updatedAt }`) types in a
      new `src/types/ai-model-binding.ts`.
- [ ] 1.2 Relax `LlmProviderConfig.model` to optional in `src/store/ai-store-types.ts` and
      add a deprecation comment pointing to the binding model.
- [x] 1.3 Define `AiModelBindingRepository` (put / get / getAll / delete) and add it to
      `PersistencePort` (`src/ports/simple-repositories.ts` + `src/ports/persistence-port.ts`),
      port interface before any adapter.

## 2. Persistence adapters (TDD)

- [x] 2.1 Write the in-memory `AiModelBindingRepository` contract test (profile scoping, one
      row per `(profileId, purpose)`, delete) — red.
- [x] 2.2 Implement `InMemoryAiModelBindingRepository` in `src/test-utils/` — green.
- [x] 2.3 Implement `DexieAiModelBindingRepository` (`src/adapters/dexie/`); add
      `aiModelBindings: "[profileId+purpose], profileId"` to `dexie-schemas.ts` as `v22`.
- [x] 2.4 Add `registerV22` in `register-kaiord-versions-v10-plus.ts` and wire it in
      `register-kaiord-versions.ts`.
- [x] 2.5 Write the v22 migration test (`dexie-v22-migration.test.ts`): fresh-install at v22;
      upgrade backfills a `default` binding from the existing default provider's id+model;
      upgrade with zero providers adds an empty store — red, then implement the `upgrade()`
      backfill — green.
- [x] 2.6 Confirm `isPerProfileTable` auto-discovers `aiModelBindings` (cascade) and the
      snapshot export includes it; add/extend tests asserting cascade + snapshot membership.

## 3. SDK-sourced model catalog

- [x] 3.1 Write `scripts/generate-model-catalog.mjs`: parse installed
      `@ai-sdk/anthropic|openai|google` type defs, extract `*ModelId` literals, filter to
      chat/text models, emit `src/lib/generated/model-catalog.ts`
      (`Record<LlmProviderType, ModelOption[]>`). Add `generate:model-catalog` package script.
- [x] 3.2 Write `scripts/generate-model-catalog.test.mjs` (`node:test`) covering extraction,
      chat-model filtering, and exclusion of embeddings/tts/image/moderation ids.
- [x] 3.3 Write `scripts/check-model-catalog.mjs` (regenerate-in-memory, diff against the
      committed file, fail on drift) + its `*.test.mjs`; wire into `pnpm test:scripts`.
- [x] 3.4 Generate the catalog and replace `PROVIDER_MODELS` in `src/lib/provider-models.ts`
      with imports from the generated catalog; `getDefaultModel(type)` returns the catalog's
      first id for that type. Remove the hardcoded model arrays.

## 4. Resolver & binding use-cases (TDD)

- [ ] 4.1 Write `resolve-model-for-purpose.test.ts` covering the full fallback chain: purpose
      override → default binding → default provider + catalog model → none; stale-provider
      skip; no-providers → none — red.
- [ ] 4.2 Implement pure `src/application/ai/resolve-model-for-purpose.ts` — green.
- [ ] 4.3 Add binding use-cases (`set-model-binding.ts`, `clear-model-binding.ts`) with tests,
      validating `providerId` exists and `purpose` is valid.
- [ ] 4.4 Add a `useAiModelBindingsLive(profileId)` reactive hook (one `useLiveQuery`).

## 5. Factory seam + wire consumers

- [ ] 5.1 Change `createLanguageModel` to `(credential: { type, apiKey }, modelId: string)`;
      update its tests. (`@kaiord/ai` factories untouched.)
- [ ] 5.2 Route chat (`ChatPage.tsx` / `build-chat-agent.ts`) through `resolveModelForPurpose`
      for the `chat` purpose; preserve mid-conversation provider switching.
- [ ] 5.3 Route free-text generation (`useAiGeneration.ts`), coaching conversion
      (`use-coaching-ai-helpers.ts`), and batch (`batch-prepare.ts`) through the resolver for
      `workout_generation`; delete the four divergent fallback chains.
- [ ] 5.4 Ensure `AiMeta.model` (audit) is written from the resolved `modelId`, not the
      credential record; update generation/coaching/batch tests.

## 6. Settings UI

- [ ] 6.1 Remove `ModelSelect` from `ProviderForm.tsx` and `ProviderEditRow.tsx`; the forms
      collect type + label + API key only. Update their tests/stories.
- [ ] 6.2 Build a reusable model picker (catalog `<select>` for the chosen provider's type +
      free-text "custom model id" input) with tests.
- [ ] 6.3 Add a per-profile "Models" section to `AiTab.tsx`: default model row + Chat and
      Workout-generation override rows (provider select + model picker), persisting via the
      binding use-cases. Component + interaction tests.

## 7. Verification & ship

- [ ] 7.1 Grep for remaining reads of `provider.model` / `config.model`; confirm none drive
      inference (only migration + audit-source).
- [ ] 7.2 `pnpm -r build && pnpm -r test && pnpm lint:fix` clean; frontend coverage ≥70%;
      `pnpm test:scripts` (incl. catalog freshness guard) green.
- [ ] 7.3 `pnpm lint:specs` passes; run `/opsx:verify` against the scenarios.
- [ ] 7.4 Add a changeset (`@kaiord/workout-spa-editor`: minor) describing key-only providers,
      per-use models, and the SDK-sourced catalog.
