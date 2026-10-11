# @kaiord/ai

## 9.4.0

### Minor Changes

- 97dfd05: A retired model now heals to its same-tier successor instead of the provider default (`claude-3-haiku-20240307` → `claude-haiku-4-5`, `claude-opus-4-1` → `claude-opus-5`): `RETIRED_MODELS` maps each retired id to its successor, and the new `DEPRECATED_MODELS` lists models still served but announced for retirement, with successor and date. New helpers `modelForProvider`, `retiredSuccessor` and `deprecationOf` are exported from `@kaiord/ai/providers`. The Anthropic default is now `claude-sonnet-5`, and `getDefaultModel` returns the curated default with no silent fallback. `isModelNotFoundError` now requires an error body that names a model, so a 404 with an unrelated body is no longer treated as a missing model.
- 97dfd05: New `readProviderError` in `@kaiord/ai/providers` reads a provider failure's structured fields (status code, body `type`/`code`/`status`/`message`) through `lastError`/`cause` wrappers, and `namesMissingModel` classifies them. `isModelNotFoundError` is built on both: a typed body is authoritative, so a 400 whose message merely echoes "not_found_error ... model" is no longer read as a missing model; the message text is consulted only for body-less errors.

### Patch Changes

- fb2d94c: A chat action-tool call whose input fails the tool's schema is no longer offered for confirmation. The SDK already answers such a call with a tool error and continues the loop, so `runTurn` drops it and the turn pauses on the last valid action call instead.
- fb2d94c: The `set_data_route` chat-tool eval fixture now carries the production tool's field descriptions, including which fields each action requires, and its priority-needs-`sourceOrder` rule, so evals grade the model against the schema it actually sees.
- fb2d94c: The `set_data_route` chat-tool eval fixture now serialises to a top-level `type: "object"` input schema, which Anthropic and OpenAI require, mirroring the SPA tool.
- fb2d94c: `runTurn` now rethrows the provider's own error (an `APICallError` with its `statusCode`) whenever a chat turn's stream fails: in place of the SDK's generic `NoOutputGeneratedError` when no step completed, and instead of silently returning the earlier step's partial result when a later step fails. It also no longer lets the SDK log the failed request to the console. Tool failures are unaffected; they stay tool results inside the loop.
- 97dfd05: The model catalog no longer offers models the provider has retired or deprecated (`claude-3-haiku-20240307`, `claude-opus-4-1`, `claude-opus-4-0`, `claude-sonnet-4-0` and their dated ids), and the default model per provider is a curated current model (`claude-sonnet-5`, `gpt-5-mini`, `gemini-2.5-flash`) instead of the catalog's oldest entry. A saved choice pointing at a retired model resolves to its same-tier successor, `isModelNotFoundError` detects a provider rejecting the model, and the SPA shows "This model is no longer available — pick another in Settings → AI" instead of a generic failure.
- Updated dependencies [791740f]
- Updated dependencies [8119609]
  - @kaiord/core@10.3.0

## 9.3.2

### Patch Changes

- 71a5945: Internal code reduction, no behavior change.
- e99dac0: Distinguish "measured and failed" from "never measured" in the eval suite.
  `unmeasured` is now a member of the dimension-outcome union carrying a reason
  and no score, so a criterion nobody measured cannot enter a rate. Reports tally
  each dimension as `{measured, passed, unmeasured, reasons}`, and a dimension
  with no measurements has no rate at all rather than 0% or 100%.
- 55b5701: Stop untrusted text from breaking out of its fence. `fenceUntrusted` now
  neutralizes the fence delimiters inside the payload before wrapping it, so
  external text carrying the closing delimiter can no longer end the fence early
  and land its remainder in trusted prompt space. The replacement carries no
  `<`, so a delimiter cannot re-form from the neighbours of a neutralized one.
- cf20f4a: Move the workspace to vitest 5. Dev-dependency only; no runtime behaviour changes.

## 9.3.1

### Patch Changes

- 4e1e2f7: Bump runtime dependencies in the minor-and-patch group: @noble/hashes 2.3.0 (core), @garmin/fitsdk 21.213.0 (fit), @ai-sdk/anthropic 4.0.39 / @ai-sdk/google 4.0.44 / @ai-sdk/openai 4.0.41 / ai 7.0.66 (ai). Regenerated the Gemini model catalog, which now includes gemini-3.7-flash.
- Updated dependencies [4e1e2f7]
  - @kaiord/core@10.1.2

## 9.3.0

### Minor Changes

- c29b9cf: feat(ai): centralize provider and prompt plumbing behind subpath exports

  Adds two additive subpath exports to `@kaiord/ai`:

  - `@kaiord/ai/providers` — provider model factory (`createLanguageModel`, with
    an opt-in `{ browser }` flag for the Anthropic direct-browser-access header),
    the SDK-sourced model catalog and its generation/freshness machinery,
    `resolveModelForPurpose`, and the provider/credential/binding types.
    `@ai-sdk/anthropic|openai|google` are now optional peer dependencies.
  - `@kaiord/ai/prompts` — a versioned prompt registry (`definePrompt`/
    `resolvePrompt`), the workout-parser and chat system prompts, the generation
    user-prompt builder with its Spanish coaching dictionary, and the
    untrusted-data fence utility.

  Existing root exports (`createTextToWorkout`, `createChatAgent`, `ChatTool`, …)
  are unchanged. No breaking change.

- d777295: feat(ai): tag input-validation errors with a stable reason and details

  `AiParsingError` gains optional `reason` (`input_empty` | `input_too_long`)
  and `details` (e.g. `{ maxLength, actualLength }`) fields, set by
  `validateInput`, so consumers can localize or branch on the specific failure
  by code instead of matching the English message. Additive and
  backward-compatible: both fields are optional and the constructor's new
  `options` argument defaults to none.

- b40f4a0: Add the agent runtime (Wave 2 kickoff). New `@kaiord/ai/agents` subpath ships a
  declarative `AgentDefinition` and a generate-mode runtime with multimodal
  document input, a validate-and-retry-with-feedback loop, token-usage reporting,
  and cancellation. New `@kaiord/ai/observability` subpath ships a minimal,
  redaction-safe telemetry port (`run_finished`/`run_failed`) with console and
  ring-buffer sinks. A new shipped `lab-extractor` agent extracts structured lab
  values from a report document, and a deterministic keyless eval lane on
  `MockLanguageModelV4` exercises the real runtime in CI. `createTextToWorkout`
  becomes a behavior-preserving deprecated wrapper over the runtime. All additive;
  no breaking changes.
- 7c15906: feat(ai): forward an optional telemetry sink through the text-to-workout wrapper

  `TextToWorkoutConfig` gains an optional `telemetry?: AiTelemetrySink` field. When
  supplied, `createTextToWorkout` forwards it to the generate-mode runtime it
  already delegates to, so a workout-generation run emits `run_finished`/
  `run_failed` through the same observability port as the agent runtime. Additive
  and behavior-preserving: the field is optional, the deprecated wrapper keeps its
  signature and `AiParsingError` semantics, and omitting it is unchanged. No
  breaking change.

### Patch Changes

- 8e6b497: chore(deps): bump ai from 6.0.177 to 7.0.14
- e4dad42: chore(deps): bump @ai-sdk/anthropic from 3.0.85 to 4.0.7
- 6025135: chore(deps): bump the minor-and-patch group across 1 directory with 47 updates
- 32c4c1c: chore(deps-dev): bump @types/node from 25.7.0 to 26.1.0
- 95da9fa: Internal code-reduction sweep: remove dead files, unused re-exports and types,
  consolidate genuine duplication, and drop redundant constructs across packages.

  No public API or runtime behavior change — every removed symbol was unused
  (grep-confirmed across the monorepo) and none belonged to a package's published
  `src/index.ts` surface. The `@kaiord/zwo` `zod` dependency is dropped (its only
  users were the deleted schemas). All test suites stay green and coverage is at
  or above baseline in every package.

- Updated dependencies [6025135]
- Updated dependencies [e167efe]
- Updated dependencies [32c4c1c]
- Updated dependencies [95da9fa]
- Updated dependencies [372db2c]
- Updated dependencies [dfa21e6]
- Updated dependencies [9f08136]
- Updated dependencies [d777295]
- Updated dependencies [0841993]
- Updated dependencies [63c4cb6]
- Updated dependencies [a2a5b12]
- Updated dependencies [78c1866]
  - @kaiord/core@10.0.0

## 9.2.0

### Minor Changes

- 2af582f: Add an in-SPA AI chat assistant.

  `@kaiord/ai` gains `createChatAgent`: a provider-agnostic, multi-step
  tool-calling chat engine on the Vercel AI SDK (read tools auto-execute;
  action tools pause for explicit user confirmation and resume).

  The workout SPA editor gains a `/chat` page that answers questions over the
  user's own history (workouts, coaching, the six health metrics) and performs
  confirmation-gated actions (sync coaching, create a workout, log a health
  metric), reusing the existing AI provider credentials. Transcripts persist
  per profile (Dexie v20 `chatMessages`) and ride the existing cross-device
  cloud-sync snapshot; per-turn token usage is recorded in the monthly usage
  row. No new backend and no new runtime dependencies.

### Patch Changes

- 73a2ce4: feat(cli): semantic failure exit codes. A single typed `mapErrorToExitCode` replaces the previous divergent mappers and message-substring matching; new `ENVIRONMENT_ERROR` (missing bundled schema/dependency → reinstall hint) and `SERVICE_ERROR` (Garmin Connect API/network) codes mean environmental and external-service failures no longer collapse into `UNKNOWN_ERROR`. A single `FORMAT_REGISTRY` now sources the format vocabulary.

  fix(garmin): `WorkoutSummary.sport` now carries KRD sport vocabulary (via the sport mapper) instead of the raw Garmin `sportTypeKey`.

  Internal semantic hardening with no other behavior changes: lossy adapter conversions (zwo watts→%FTP, garmin truncation / unknown-enum / REPS, tcx-zwo intensity narrowing) now emit named `Lossy conversion:` warnings with named assumed/fallback constants; duplicated domain rules are single-sourced (fit bpm offset and zone bounds, fit FIT-timestamp helper, core health version gate, garmin-connect retry policy); core round-trip methods gained honest port-level names (`validateBinaryRoundTrip`/`validateKrdRoundTrip`) with deprecated FIT-named aliases; MCP tool errors carry a machine-readable `structuredContent.error` classification and `kaiord_get_recovery_status` reports `skipped`.

- Updated dependencies [73a2ce4]
- Updated dependencies [bad73d3]
- Updated dependencies [cfb1b06]
  - @kaiord/core@9.2.0

## 9.0.0

### Patch Changes

- Updated dependencies [a015501]
- Updated dependencies [82a7467]
- Updated dependencies [275c221]
- Updated dependencies [d597cb4]
  - @kaiord/core@9.0.0

## 8.0.0

### Patch Changes

- Updated dependencies [581239f]
  - @kaiord/core@8.0.0

## 7.3.2

### Patch Changes

- 5f3a93a: Disable the AI SDK's internal retry layer (`maxRetries: 0` on every `generateText` call). `executeWithRetry` already owns the retry loop and the non-retryable APICallError gate, so the SDK's `retry-with-exponential-backoff` was a redundant second layer — a retryable 5xx could fan out to up to (SDK-maxRetries+1) × (executeWithRetry-maxRetries+1) = 9 HTTP calls per user click. Collapsing to one layer makes the per-click HTTP cost predictable (≤ `maxRetries + 1` attempts) and unblocks the e2e flow b mock from needing the multi-call workaround.
- 51f98ba: Propagate non-retryable `APICallError` immediately from `executeWithRetry` instead of catching it as a prompt-correction retry. Auth errors (e.g. 401/403 from Anthropic) and other provider-classified non-retryable failures now surface in one call rather than three, saving tokens and latency for users with revoked or misconfigured API keys. Provider-classified retryable failures (overloaded errors, network blips) continue to retry as before, and schema validation failures still trigger the prompt-correction loop.

## 7.1.1

### Patch Changes

- 4fc4308: Internal build + CI hardening release. No public API changes, no runtime behavior changes.
  - **TypeScript 6.0.3**: toolchain migrated from TS 5.9.3 across all packages. Consumers can now opt into TS 6 without hitting `baseUrl` deprecation warnings in shipped type declarations.
  - **Dedupe vite to 8.x**: removed the dual-vite-major state in the lockfile (vite 7.3 was coming in via vitepress alpha). `pnpm.overrides` forces a single major.
  - **Dependabot sweep**: @garmin/fitsdk 21.200→21.201, vitest 4.1.4→4.1.5, tailwindcss 4.2.2→4.2.4, lucide-react 1.8→1.11, vue 3.5.32→3.5.33, ora 9.3→9.4, @codecov/vite-plugin 1.9→2.0, @fission-ai/openspec 1.3.0→1.3.1, plus 3 GitHub Actions version bumps.
  - **CI hardening**: Link-checker is now a required status check + lychee pinned to v0.24; `enforce_admins` enabled on main branch protection; CHANGELOG.md excluded from cspell; `pnpm-lock.yaml` excluded from prettier (eliminates a recurring push-time reformat loop).
  - **Build watchdog**: `scripts/check-tsup-ignoredeprecations.mjs` auto-fails lint the day tsup fixes [egoist/tsup#1388](https://github.com/egoist/tsup/issues/1388), so the repo self-heals to drop the last remaining `ignoreDeprecations` silencer without manual tracking.

  No API additions, removals, or behavioral changes. Published packages consume the same surface as 7.0.0.

- Updated dependencies [4fc4308]
  - @kaiord/core@7.1.1

## 7.0.0

### Major Changes

- 99271a8: Drop Node.js 20 support. Minimum required runtime is now Node.js 22.12.0.

  Node.js 20 reaches end-of-life on 30 April 2026. Upstream dependencies (cspell v10, jsdom 29.0.2, @eslint/js v10) have already dropped support. Bump your Node.js toolchain to 22.x (Maintenance LTS) or 24.x (Active LTS).

### Patch Changes

- Updated dependencies [99271a8]
  - @kaiord/core@7.0.0

## 4.9.0

### Minor Changes

- 23c788c: feat: natural language to Garmin Connect web integration
  - Add AI workout generation UI with multi-provider support (Anthropic, OpenAI, Google)
  - Add Garmin Connect push flow via self-hostable Lambda proxy
  - Add Settings panel with AI provider, Garmin credentials, and privacy tabs
  - Add LLM eval suite with 22 curated benchmarks
  - Add Playwright E2E tests for AI generation, Garmin push, and settings flows
  - Add @kaiord/infra package for self-hostable AWS CDK stack

### Patch Changes

- Updated dependencies [23c788c]
  - @kaiord/core@4.9.0

## 4.8.0

### Minor Changes

- 8efe9ac: Add @kaiord/ai package for LLM-powered workout parsing via Vercel AI SDK v6
