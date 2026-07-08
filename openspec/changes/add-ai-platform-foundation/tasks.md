## 1. Changesets ungroup (independent chore, lands first)

- [x] 1.1 Remove `@kaiord/ai` from the `linked` array in `.changeset/config.json`; leave the PUBLISHABLE list and all workflows untouched.
- [x] 1.2 Verify `pnpm exec changeset status` (or a dry `changeset version`) shows `@kaiord/ai` versioning independently; no changeset needed for the config edit itself.

## 2. Dead prompt code removal (SPA)

- [x] 2.1 Delete `SYSTEM_PROMPT_TEMPLATE` and `buildSystemPrompt` from `packages/workout-spa-editor/src/application/ai-prompts.ts`, keeping `buildUserPrompt`, `PROMPT_VERSION`, and `SPANISH_ABBREVIATION_DICTIONARY`.
- [x] 2.2 Remove their test cases from `application/ai-prompts.test.ts` (keep `buildUserPrompt` cases); confirm no remaining importer via grep; SPA suite green.

## 3. `@kaiord/ai/providers` subpath

- [x] 3.1 Write the failing cross-subpath module-identity smoke test first; then configure tsup multi-entry (`.`, `./providers`) with `splitting: true` and extend the `exports` map (`import` + `types` per entry); verify the `.md` text loader still applies to all entries.
- [x] 3.2 Move types into `packages/ai/src/providers/`: `LlmProviderType`, `ProviderCredential`, `AiModelPurpose` widened to the open union `"default" | "chat" | "workout_generation" | (string & {})`, `AiModelBinding`, `ResolvedModel`; SPA `LlmProviderConfig` keeps Dexie-specific fields locally and satisfies the moved types structurally.
- [x] 3.3 Move `resolveModelForPurpose` with its test suite; tests stay green unmodified (pure move).
- [x] 3.4 Move `createLanguageModel` with its tests; replace the hardcoded Anthropic browser header with `options: { browser?: boolean }`; add test cases: header present only with `browser: true`, absent otherwise, and per-provider lazy `import()` preserved.
- [x] 3.5 Move the catalog machinery wholesale into `packages/ai`: `generate-model-catalog.mjs`, `model-catalog-extract.mjs`, the freshness test (fix its relative extractor import), the generated catalog, and `getDefaultModel`; `pnpm generate:model-catalog` becomes a `packages/ai` script; regenerate once to prove the pipeline.
- [x] 3.6 Update `packages/ai/package.json`: add `@ai-sdk/anthropic|openai|google` as optional `peerDependencies` WITH `peerDependenciesMeta.optional: true` and as `devDependencies`; update `knip.json` for the new entries/deps; `pnpm install` clean.
- [x] 3.7 Rewire all SPA imports to `@kaiord/ai/providers` (provider factory, resolution, catalog, types); delete the vacated SPA modules; SPA passes `browser: true` to the factory.
- [x] 3.8 Keep the SPA vite stub aliases (`@ai-sdk/gateway`, `zod/v3`) and the SPA `@ai-sdk/*` deps; add a load-bearing comment in `vite.config.ts` explaining why they must not be removed.
- [x] 3.9 Add changeset: `@kaiord/ai` minor (`./providers` subpath).

## 4. `@ai-sdk/*` containment guard

- [x] 4.1 Write `scripts/check-ai-sdk-containment.test.mjs` first (`node:test`): flags an `@ai-sdk/*` import under `packages/workout-spa-editor/src/`, allows it under `packages/ai/src/`, ignores `dist/`/`node_modules/`/config strings.
- [x] 4.2 Implement `scripts/check-ai-sdk-containment.mjs` (import-declaration check over `packages/*/src/**`, `packages/ai` exempt); wire into `pnpm test:scripts`; verify the pre-commit hook picks it up and the full tree passes.

## 5. `@kaiord/ai/prompts` subpath

- [x] 5.1 Write snapshot tests FIRST pinning the current assembled text of: the `parse-workout.md` system prompt (with `{{sport}}` injected), the SPA chat system prompt, and a representative `buildUserPrompt` output — these snapshots must not change through the migration.
- [x] 5.2 Implement the registry in `packages/ai/src/prompts/`: `definePrompt({ id, version, template, variables })` and `resolvePrompt(id, { vars })`; unknown prompt id and missing declared variable fail fast; add unit tests (AAA, `should …`).
- [x] 5.3 Register `workout-parser/system` (absorbing `load-prompt.ts` templating) and switch `text-to-workout.ts` to resolve it via the registry; snapshot green.
- [x] 5.4 Move the chat system prompt to the registry as `fitness-assistant/system` (version stays `1.0.0`); rewire `hooks/chat/build-chat-agent.ts`; re-export `CHAT_PROMPT_VERSION` from the registry entry; snapshot green.
- [x] 5.5 Move `buildUserPrompt` + `PROMPT_VERSION` + `SPANISH_ABBREVIATION_DICTIONARY` to the registry as `workout-parser/user` (version stays `1.0.0`); rewire `application/ai-workout-processor.ts` and `components/molecules/CoachingCard/use-coaching-ai-helpers.ts`; persisted `aiMeta.promptVersion` values unchanged; snapshot green.
- [x] 5.6 Move `fence.ts` (untrusted-data fencing, 500-char cap) to `@kaiord/ai/prompts` as a plain exported function; rewire chat tool imports; behavior tests travel with it.
- [x] 5.7 Add changeset: `@kaiord/ai` minor (`./prompts` subpath).

## 6. Quality gates

- [x] 6.1 `pnpm -r test && pnpm -r build && pnpm lint` green across the monorepo; file/function caps respected; coverage thresholds met (80% core packages / 70% frontend).
- [x] 6.2 `pnpm lint:specs` green (this change's delta specs + modified domain specs validate).
- [ ] 6.3 Evidence run: manual `pnpm eval` (same model + benchmarks) before and after the prompt migration; attach the reporter output to the PR as behavior-preservation evidence.

  > Requires a real `ANTHROPIC_API_KEY`; run before opening the PR. The
  > byte-identical prompt snapshot tests
  > (`packages/ai/src/prompts/prompt-snapshot.test.ts`) are the automated
  > behavior-preservation guard in the meantime.
