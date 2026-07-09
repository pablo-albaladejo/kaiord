# Tasks: add-ai-usage-telemetry-sink

Ordered TDD-first and so every section leaves `pnpm -r test && pnpm -r build &&
pnpm lint` green. The live `usage` row and its panel stay untouched throughout;
the new path runs in parallel until the follow-up cutover.

## 1. Event-log schema, store, and migration (v32)

- [ ] 1.1 Add a `usageEventSchema` (zod) in
      `packages/workout-spa-editor/src/types/usage-schemas.ts` (or a sibling):
      `{ id, traceId, yearMonth (YYYY-MM), date (iso date), purpose, providerType,
    modelId, promptTokens, completionTokens, tokens, cost, createdAt }` with the
      `tokens === promptTokens + completionTokens` refine and non-negative ints;
      export `UsageEventRecord`. Unit test (AAA, `should …`): accepts a valid
      row, rejects a token-mismatch row.
- [ ] 1.2 Add the v32 store to the schema builder
      (`dexie-schemas-late.ts`): `buildCoreV32(prev) => ({ ...prev, usageEvents:
    "id, [yearMonth+purpose]" })`, composed into `dexie-schemas.ts`; register
      `db.version(32).stores(SCHEMAS.v32)` in `register-kaiord-versions-v10-plus.ts`
      (additive, no `.upgrade`).
- [ ] 1.3 Add `dexie-v32-migration.test.ts`: opening at v32 over a v31 db with
      existing `usage` rows leaves `usageEvents` present+empty and `usage`
      unchanged.
- [ ] 1.4 Add `"usageEvents"` to `DEVICE_LOCAL` in `dexie-snapshot-port.ts`;
      extend its test to assert `usageEvents` is excluded from the exported
      data tables.

## 2. Port + Dexie adapter

- [ ] 2.1 Define `UsageEventRepository` in `ports/` (pattern of
      `simple-repositories`): `append(record: UsageEventRecord): Promise<void>`,
      `listByMonth(yearMonth: string): Promise<UsageEventRecord[]>`; add
      `usageEvents: UsageEventRepository` to `PersistencePort`.
- [ ] 2.2 Implement `createDexieUsageEventRepository(db)` in
      `adapters/dexie/`, mirroring `dexie-usage-repository.ts`; wire it into the
      persistence adapter factory. Unit test: append then `listByMonth` returns
      the row; `listByMonth` filters by month.

## 3. Writer, fold, and provider map (application layer, pure/awaitable)

- [ ] 3.1 `provider-type-from-sdk.ts`: `providerTypeFromSdk(provider: string):
    LlmProviderType | undefined` (prefix map anthropic/openai(+azure)/google(+gemini)).
      Unit test the mapped and unmapped cases.
- [ ] 3.2 `append-usage-event.ts`: `appendUsageEvent(persistence, input, now?,
    newId?)` — same zero-token skip and `estimateCost(tokens,
    getProviderRate(providerType))` as `recordChatUsage`; builds and appends
      one `UsageEventRecord`. Unit tests: cost equals the legacy formula; zero
      tokens writes nothing; row fields correct.
- [ ] 3.3 `fold-usage-events.ts`: pure `foldUsageEvents(events, opts?: { purpose? })
    => { inputTokens, outputTokens, totalTokens, totalCost }`, summing by
      `createdAt` ascending, optional purpose filter. Unit tests: sums a set;
      purpose filter excludes others; empty → zeros.

## 4. Dexie telemetry sink (adapter)

- [ ] 4.1 `createDexieUsageTelemetrySink(persistence, logger?)` implementing
      `AiTelemetrySink`: on `run_finished` with usage → map provider, build input,
      `void appendUsageEvent(...).catch(warn)` (fire-and-forget); no-op on
      `run_failed` / missing usage; unmapped provider → cost 0 + warn.
- [ ] 4.2 Unit tests (fake persistence): finished-with-usage appends a row;
      `run_failed` appends nothing; a rejecting append does not throw out of
      `emit`; unmapped provider records tokens with cost 0.

## 5. Instrument the run sites (side benefit)

- [ ] 5.1 `@kaiord/ai`: add optional `telemetry?: AiTelemetrySink` to
      `TextToWorkoutConfig` (`packages/ai/src/types.ts`) and forward it in
      `createTextToWorkout`'s `runGenerateAgent` call
      (`adapters/text-to-workout.ts`). No behavior change when omitted; existing
      text-to-workout tests stay green. Add a test that a passed sink receives a
      `run_finished` event (MockLanguageModelV4).
- [ ] 5.2 SPA generation: `generateWorkoutKrd` builds the Dexie sink from the
      persistence handle and passes it via `createTextToWorkout({ model,
    telemetry })`. Batch reuses `generateWorkoutKrd`, so it inherits accounting
      — add/extend a test asserting a generation run appends a
      `workout_generation` event.
- [ ] 5.3 SPA lab extraction: thread the sink into `runLabExtraction`'s
      `runGenerateAgent(..., { model, signal, telemetry })`; the labs hook
      supplies it. Test asserts a `lab_extraction` event is appended.

## 6. Chat dual-write

- [ ] 6.1 In `appendAssistantTurn` (`application/chat/append-turn-messages.ts`),
      after `recordChatUsage`, also `await appendUsageEvent(persistence, {
    purpose: "chat", providerType, promptTokens, completionTokens }, gen.now)`.
      Keep `recordChatUsage` authoritative and unchanged.
- [ ] 6.2 Extend `append-turn-messages` tests: a turn writes BOTH the live
      `usage` row and a `purpose: "chat"` event with identical counts; a
      zero-usage turn writes neither.

## 7. Parity test (the gate)

- [ ] 7.1 `usage-parity.test.ts` (integration over fake-indexeddb): drive a
      multi-turn session through the dual-write path, then assert
      `foldUsageEvents(events, { purpose: "chat" })` equals the live `usage` row —
      tokens exactly, `totalCost` within `1e-9`.
- [ ] 7.2 Add a case: a month that also contains `workout_generation` /
      `lab_extraction` events still yields chat parity (non-chat excluded) and
      the live `usage` row is not double-counted.

## 8. Wire-up, guards, changeset

- [ ] 8.1 Run `pnpm -r test && pnpm -r build && pnpm lint`; fix any
      zero-warning violations (line caps, R-ItBodyAAA, R-PIIInterpolation on any
      new toast/console, R-DexieImport/write-through guards) in touched files.
- [ ] 8.2 `pnpm exec changeset` — `@kaiord/ai` minor: "add optional telemetry
      sink passthrough to the text-to-workout wrapper".
- [ ] 8.3 `pnpm lint:specs` green for the new capability spec; `npx openspec
    validate --strict add-ai-usage-telemetry-sink` green.
- [ ] 8.4 `/opsx:verify` against the spec scenarios; then PR.
