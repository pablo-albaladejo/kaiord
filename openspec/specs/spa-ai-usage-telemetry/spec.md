> Synced: 2026-07-10 (add-ai-usage-telemetry-sink)

# spa-ai-usage-telemetry Specification

## Purpose

The SPA usage event log and its Dexie telemetry sink: a redaction-safe, append-only `usageEvents` store fed by the `@kaiord/ai` telemetry port, the shared `appendUsageEvent` writer and `foldUsageEvents` fold, run-site instrumentation (generation, batch, lab extraction), the chat dual-write that keeps `recordChatUsage` authoritative for the live `usage` row, and the fold-vs-legacy parity invariant that gates the future reader cutover.

## Requirements

### Requirement: Redaction-safe usage event log

The SPA SHALL persist AI token usage as an append-only Dexie event log
(`usageEvents`, added at schema v32) that carries identifiers and metrics only —
never prompts, document bytes, model output, or API keys. Each row SHALL record
`{ id, traceId, yearMonth, date, purpose, providerType, modelId, promptTokens,
completionTokens, tokens, cost, createdAt }`, where `tokens` equals
`promptTokens + completionTokens` and all counts are non-negative integers. The
store SHALL be excluded from the cloud snapshot (device-local) for this
transition.

#### Scenario: Event row is shape-valid

- **WHEN** a usage event is appended with `promptTokens: 120` and `completionTokens: 80`
- **THEN** the persisted row SHALL have `tokens` equal to `200` and SHALL be accepted by the usage-event schema

#### Scenario: Payload fields are impossible by construction

- **WHEN** the usage-event schema is applied to any candidate row
- **THEN** it SHALL reject rows carrying prompt text, document bytes, model output, or credential fields, because the schema defines no such fields

#### Scenario: Store is created empty on upgrade

- **GIVEN** a database at schema v31 with existing `usage` rows
- **WHEN** the database upgrades to v32
- **THEN** the `usageEvents` store SHALL exist and be empty, and the existing `usage` rows SHALL be unchanged

#### Scenario: Event log is excluded from the snapshot

- **WHEN** a cloud snapshot is exported
- **THEN** the `usageEvents` store SHALL NOT be included in the exported tables

### Requirement: Single writer applied through a repository port

The SPA SHALL write `usageEvents` only through a `UsageEventRepository` port
(`append`, `listByMonth`) via a single application-layer writer
`appendUsageEvent`. The writer SHALL compute cost with the same formula as the
legacy chat writer — `estimateCost(tokens, getProviderRate(providerType))` — and
SHALL skip a run whose total token count is zero.

#### Scenario: Cost matches the legacy formula

- **GIVEN** a `providerType` of `anthropic` and a run of `1_000_000` total tokens
- **WHEN** `appendUsageEvent` records the run
- **THEN** the stored `cost` SHALL equal `estimateCost(1_000_000, getProviderRate("anthropic"))`

#### Scenario: Zero-token run is skipped

- **WHEN** `appendUsageEvent` is called with `promptTokens: 0` and `completionTokens: 0`
- **THEN** no row SHALL be written, mirroring the legacy writer's zero-token skip

### Requirement: Telemetry sink folds runtime events into the log

The SPA SHALL provide `createDexieUsageTelemetrySink(persistence)` implementing
`AiTelemetrySink`. On a `run_finished` event that carries usage, it SHALL map
the SDK provider string to an `LlmProviderType`, compute cost, and append a
`usageEvents` row. It SHALL no-op on `run_failed` and on `run_finished` without
usage. Persisting SHALL be best-effort: a write error SHALL be swallowed (logged)
and SHALL NOT propagate into the model run.

#### Scenario: Finished run with usage is recorded

- **GIVEN** a Dexie sink over an empty log
- **WHEN** it receives a `run_finished` event with `purpose: "lab_extraction"`, provider `anthropic.messages`, and usage `{ promptTokens: 300, completionTokens: 120 }`
- **THEN** a `usageEvents` row SHALL be appended with `providerType: "anthropic"`, `tokens: 420`, and cost from the shared formula

#### Scenario: Failed run is not recorded

- **WHEN** the sink receives a `run_failed` event
- **THEN** no `usageEvents` row SHALL be written

#### Scenario: Persistence error does not surface into the run

- **GIVEN** a sink whose append rejects
- **WHEN** it receives a `run_finished` event with usage
- **THEN** `emit` SHALL NOT throw, and the failure SHALL be logged rather than propagated

#### Scenario: Unmapped provider keeps usage with zero cost

- **WHEN** a `run_finished` event carries a provider string that maps to no `LlmProviderType`
- **THEN** the row SHALL still record the token counts with `cost: 0` and a logged warning, rather than dropping the event

### Requirement: Previously unaccounted runs emit through the port

Workout generation, the batch pipeline that reuses it, and lab extraction SHALL
emit usage through the telemetry port. `runLabExtraction` SHALL pass the sink to
`runGenerateAgent`, and `generateWorkoutKrd` SHALL pass a telemetry sink through
the `createTextToWorkout` configuration.

#### Scenario: Lab extraction is accounted

- **WHEN** a lab-extraction run completes with reported token usage
- **THEN** a `usageEvents` row with `purpose: "lab_extraction"` SHALL be appended

#### Scenario: Workout generation is accounted

- **WHEN** a workout-generation run completes with reported token usage
- **THEN** a `usageEvents` row with `purpose: "workout_generation"` SHALL be appended

### Requirement: Chat dual-write keeps the legacy writer authoritative

During this transition the chat turn writer SHALL continue to call
`recordChatUsage` as the sole writer of the live `usage` row, and SHALL, in
parallel, call `appendUsageEvent` with `purpose: "chat"` using the same provider
type and token counts. The Settings usage panel SHALL keep reading the live
`usage` store; user-visible totals SHALL NOT change.

#### Scenario: A chat turn writes both stores

- **GIVEN** a chat turn with usage `{ promptTokens: 200, completionTokens: 100 }` on provider type `google`
- **WHEN** the assistant turn is persisted
- **THEN** the live `usage` row SHALL be updated by `recordChatUsage` AND a `usageEvents` row with `purpose: "chat"` SHALL be appended with the same counts

#### Scenario: The live usage row keeps a single writer

- **WHEN** any non-chat run (generation, batch, lab extraction) emits a usage event
- **THEN** only the `usageEvents` log SHALL be written, and the live `usage` row SHALL be unchanged, so it is never double-counted

### Requirement: Chat fold-vs-legacy parity

The pure `foldUsageEvents` reduction SHALL reduce a month's events, ordered by
`createdAt` ascending, into `{ inputTokens, outputTokens, totalTokens,
totalCost }`. For events scoped to `purpose: "chat"` over a session, the fold SHALL equal the
live `usage` row produced by `recordChatUsage`: token counts exactly, and
`totalCost` within an absolute tolerance of `1e-9` (floating-point sum order is
matched; cost is an estimate). Parity SHALL hold before any change proposes
retiring the legacy writer.

#### Scenario: Fold equals the legacy usage row over a session

- **GIVEN** a session of several chat turns, each persisted through the dual-write path
- **WHEN** `foldUsageEvents(events, { purpose: "chat" })` is compared to the live `usage` row for that month
- **THEN** `inputTokens`, `outputTokens`, and `totalTokens` SHALL be exactly equal AND `totalCost` SHALL differ by at most `1e-9`

#### Scenario: Non-chat events do not affect chat parity

- **GIVEN** a month whose log also contains `workout_generation` and `lab_extraction` events
- **WHEN** the chat-scoped fold is computed
- **THEN** those non-chat events SHALL be excluded and SHALL NOT change the chat parity result
