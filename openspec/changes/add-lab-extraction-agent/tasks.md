# Tasks: add-lab-extraction-agent

Ordered so the platform lands first and every section leaves
`pnpm -r test && pnpm -r build && pnpm lint` green.

## 1. `@kaiord/ai/observability` subpath (telemetry port)

- [ ] 1.1 Define the port and events in `packages/ai/src/observability/`:
      `AiTelemetrySink { emit(event) }`; `AiTelemetryEvent` union of
      `run_finished { traceId, agentId, agentVersion, promptId, promptVersion,
  provider, modelId, purpose, usage, latencyMs }` and
      `run_failed { traceId, agentId, agentVersion, promptId, promptVersion,
  provider, modelId, purpose, latencyMs, error: { name, retriable } }`.
      No payload/prompt/key fields exist on either event by construction.
- [ ] 1.2 Implement `createConsoleTelemetrySink(logger?)` and
      `createRingBufferTelemetrySink(capacity)` (exposes `events()` for
      tests/evals) plus a shared no-op default; unit tests (AAA, `should …`).
- [ ] 1.3 Add the tsup entry + `exports` map entry for `./observability`;
      extend the subpath module-identity smoke test to the new entry; update
      root `knip.json` (`entry` + nothing else); changeset note folded into
      the single `@kaiord/ai` minor (task 7.4).

## 2. `@kaiord/ai/agents` subpath (generate-mode runtime)

- [ ] 2.1 Write the deterministic smoke-lane suites FIRST (red) in
      `packages/ai/src/agents/` on `MockLanguageModelV4` from `ai/test`:
      prompt assembly from the registry, file-part passthrough (bytes +
      mediaType reach the mock), invalid-then-valid retry-with-feedback,
      strict-validation rejection after exhaustion, telemetry
      `run_finished`/`run_failed` emission on the ring sink, usage mapping,
      abort propagation. These suites run inside `pnpm test` (keyless CI
      gate for everything below).
- [ ] 2.2 Implement `definition-types.ts`: `AgentDefinition<TOutput>` =
      `{ id, version, purpose: AiModelPurpose, systemPrompt: { id, vars? },
  mode: "generate", outputSchema: z.ZodType, validate?: (raw) => TOutput,
  maxRetries?, maxOutputTokens?, temperature? }` and
      `AgentFileInput = { data: Uint8Array, mediaType, filename? }`,
      `GenerateAgentInput = { text?, files? }`,
      `GenerateAgentResult<TOutput> = { output, usage?, traceId }`.
- [ ] 2.3 Implement `prelude.ts` (resolve system prompt via the registry,
      stamp traceId/latency, emit telemetry around the run) and
      `build-user-message.ts` (text + file content parts → AI SDK message).
- [ ] 2.4 Implement `generate-mode.ts` + `retry-policy.ts` by generalizing
      `adapters/execute-with-retry.ts`: `generateText` + `Output.object`,
      feedback-on-retry, non-retryable transport passthrough (4xx except
      408/429), `abortSignal` threading, usage surfaced from the SDK result.
      Respect the 100-line/40-line caps with this decomposition.
- [ ] 2.5 Export `runGenerateAgent(definition, input, config)` where config =
      `{ model, telemetry?, logger?, signal? }`; add tsup/`exports`/knip
      entries for `./agents`; extend the module-identity test; smoke lane
      from 2.1 green.

## 3. Workout-parser on the runtime (behavior-preserving rewire)

- [ ] 3.1 Define the `workout-parser` `AgentDefinition` (id
      `workout-parser`, purpose `workout_generation`, prompt
      `workout-parser/system`, outputSchema `aiWorkoutSchema`, validate =
      strict `workoutSchema.parse` + `reindexSteps`).
- [ ] 3.2 Rewire `createTextToWorkout` as a deprecated thin wrapper over the
      definition: identical public signature, `AiParsingError` semantics
      (reason codes, attempts count), input validation unchanged. Existing
      unit tests and prompt snapshots pass UNMODIFIED; add `@deprecated`
      JSDoc pointing at `runGenerateAgent`.
- [ ] 3.3 Generalize the manual eval loader: `load-eval-model.ts` reads
      `EVAL_PROVIDER` (default `anthropic`) + `EVAL_MODEL` + the matching
      `*_API_KEY`, building the model through `./providers`; both eval CLIs
      switch to it; delete `load-anthropic-model.ts`.

## 4. Lab-extractor agent (packages/ai)

- [ ] 4.1 Add `lab-extractor/system` to the prompt registry (v `1.0.0`,
      template in `lab-extractor.md`, variable `parameters` = compact
      catalog listing "key (canonicalUnit)"); extend the prompt snapshot
      test. Prompt instructs: extract every printed parameter row verbatim
      (label, value, unit, printed reference range), normalize decimal
      commas, propose a canonical key ONLY from the provided list, never
      invent values, return the report date/lab metadata when printed.
- [ ] 4.2 Define the permissive `labExtractionSchema` (report header +
      values array of `{ label, parameterKey?, value?, unit?, refLow?,
  refHigh?, refText? }`) with unit tests; keep it flat (structured-output
      complexity limits).
- [ ] 4.3 Define the `lab-extractor` `AgentDefinition` (purpose
      `lab_extraction`, mode generate, outputSchema `labExtractionSchema`)
      and export it from `./agents`; add `"lab_extraction"` to the
      `AiModelPurpose` typed literals in `./providers` (open-union callers
      unaffected).
- [ ] 4.4 Smoke-lane suite for the extractor on `MockLanguageModelV4`
      (scripted extraction JSON; asserts file part + catalog variable in the
      prompt); manual eval benchmark with a SYNTHETIC fixture document
      (rendered fake lab table, no real clinical data) wired into the eval
      CLI.

## 5. SPA: extraction application layer

- [ ] 5.1 Thread provenance through the builders: `build-lab-report.ts` /
      `build-lab-value.ts` / `build-lab-report-submission.ts` gain an
      optional `provenance` argument defaulting to `{ source: "manual" }`;
      existing call sites unchanged; unit tests for the `ai-extracted` path.
- [ ] 5.2 Implement `application/lab/extraction/map-extraction-to-draft.ts`:
      extraction result → `{ header, rows: LabRowState[] }`. Key resolution
      order: model-proposed key if present in the catalog → display-name/
      abbreviation match via existing lookups (both locales) →
      `custom:<slug>` row carrying the verbatim label. Printed ranges set
      the row ref fields with `refTouched: true`; report date validated as
      `YYYY-MM-DD` (invalid → left blank for the user). Unit tests cover
      mapped/unmapped/range/no-range/comma-decimal cases.
- [ ] 5.3 Implement `application/lab/extraction/run-lab-extraction.use-case.ts`:
      resolve purpose `lab_extraction` via `resolveModelForPurpose`,
      `createLanguageModel(provider, modelId, { browser: true })`,
      `runGenerateAgent(labExtractorAgent, { files: [document] }, { model,
  signal })`, map to draft. Returns a typed error for the no-provider
      case. Unit tests with mocked `@kaiord/ai` modules.

## 6. SPA: extraction UI on the labs entry tab

- [ ] 6.1 `LabImportSection` on the entry tab: file input (accept
      `application/pdf`, `image/jpeg`, `image/png`, `image/webp`; 10MB cap
      with the existing size-validation pattern), disabled state with hint
      when no provider is configured, progress state with cancel
      (AbortController), error surface via the existing toast pattern
      (static first argument — R-PIIInterpolation).
- [ ] 6.2 Wire the draft into the existing form: extraction result pre-fills
      `use-lab-entry-form` state and shows an "AI-extracted draft — review
      before saving" banner; Save persists through the existing
      `saveLabReport` with provenance `ai-extracted`; Reset/discard clears
      the draft and the banner; manual entry keeps `manual` provenance.
- [ ] 6.3 Add en/es i18n strings for all new UI copy; extend the settings
      ModelPicker purpose list with `lab_extraction`; component tests
      (upload→review→save happy path with mocked use case, no-provider
      state, error state, discard).

## 7. Quality gates

- [ ] 7.1 `pnpm -r test && pnpm -r build && pnpm lint` green across the
      monorepo; file/function caps respected; coverage thresholds met
      (80% core packages / 70% frontend); `lint:ai-sdk-containment` green.
- [ ] 7.2 `pnpm lint:specs` green (this change's delta specs validate).
- [ ] 7.3 Verify chat is untouched: no diff under `packages/ai/src/chat/`
      and no change to `spa-ai-chat` behavior/suites.
- [ ] 7.4 Add the single changeset: `@kaiord/ai` minor (`./agents` +
      `./observability` subpaths, lab-extractor agent, eval lane).
- [ ] 7.5 Evidence run (manual, needs API keys): `pnpm eval` before/after
      the workout-parser rewire on the same model + 22 benchmarks; run the
      lab-extractor benchmark against the synthetic fixture; attach reporter
      output to the PR.
