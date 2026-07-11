> Synced: 2026-07-11 (cutover-usage-accounting-to-event-log)

# spa-ai-usage-telemetry Specification

## Purpose

The SPA usage event log: a redaction-safe, append-only, **synced** `usageEvents` store that is the single authoritative record of AI token usage — fed by the `@kaiord/ai` telemetry port (Dexie sink) for agent runs and directly by the chat path, both through the shared `appendUsageEvent` writer. It aggregates cross-device by append-only union-by-id, is rendered per month with a per-purpose breakdown in Settings via `foldUsageEvents`, and is retention-pruned to stay bounded. There is no legacy `usage` table or dual-write.

## Requirements

### Requirement: Redaction-safe usage event log

The SPA SHALL persist AI token usage as an append-only Dexie event log (`usageEvents`) that carries identifiers and metrics only — never prompts, document bytes, model output, or API keys. Each row records `{ id, traceId, yearMonth, date, purpose, providerType, modelId, promptTokens, completionTokens, tokens, cost, createdAt }`, with `tokens = promptTokens + completionTokens` and non-negative integer counts, enforced by a `.strict()` schema parsed at the single write boundary. The log is the authoritative usage store and is **synced** across devices (it is NOT in the snapshot device-local set); there is no separate `usage` table.

#### Scenario: Event row is shape-valid and payload-free

- **WHEN** a usage event is appended with `promptTokens: 120` and `completionTokens: 80`
- **THEN** the row SHALL have `tokens` equal to `200`, and the schema SHALL reject any row carrying prompt text, document bytes, model output, or credential fields

#### Scenario: The log participates in the cloud snapshot

- **WHEN** a cloud snapshot is exported
- **THEN** the `usageEvents` store SHALL be included (synced), unlike the device-local stores

### Requirement: Single writer applied through a repository port

The SPA SHALL write `usageEvents` only through `appendUsageEvent`, the single application-layer writer, over the `UsageEventRepository` port. It is THE authoritative usage writer — there is no legacy `usage` row and no dual-write. It computes cost as `estimateCost(tokens, getProviderRate(providerType))` and skips a run whose total token count is zero. Chat turns call it directly with `purpose: "chat"`; agent runs reach it via the Dexie telemetry sink.

#### Scenario: Cost formula and zero-token skip

- **WHEN** `appendUsageEvent` records a `1_000_000`-token `anthropic` run
- **THEN** the stored `cost` SHALL equal `estimateCost(1_000_000, getProviderRate("anthropic"))`, and a zero-token run SHALL write nothing

#### Scenario: A chat turn writes one usage event directly

- **GIVEN** a chat turn with usage `{ promptTokens: 200, completionTokens: 100 }` on provider type `google`
- **WHEN** the assistant turn is persisted
- **THEN** exactly one `usageEvents` row with `purpose: "chat"` SHALL be appended, and no legacy `usage` row SHALL be written (none exists)

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

### Requirement: Usage aggregates cross-device by append-only union

The synced `usageEvents` log SHALL aggregate across devices by append-only union: each run is one row with a unique id, so the generic snapshot merge unions rows by id (last-write-wins per `createdAt`, tombstone-suppressed) rather than overwriting one device's totals with another's.

#### Scenario: Two devices' events union

- **GIVEN** device A and device B each recorded distinct usage events in the same month
- **WHEN** their snapshots merge
- **THEN** the merged log SHALL contain every event from both devices (deduplicated by id), so the folded month reflects both devices

#### Scenario: A tombstoned event is suppressed

- **GIVEN** an event id that has a tombstone
- **WHEN** snapshots merge
- **THEN** that event SHALL NOT appear in the merged log

### Requirement: The usage panel renders the monthly fold with a per-purpose breakdown

The Settings usage panel SHALL read `usageEvents` for the current month plus the previous five and render each month's folded totals (input, output, total tokens, cost), plus a per-purpose breakdown (chat, workout_generation, lab_extraction). It SHALL read live via `useLiveQuery`; months with no events SHALL NOT render.

#### Scenario: Panel folds the log per month

- **GIVEN** a month with chat and workout_generation events
- **WHEN** the usage panel renders that month
- **THEN** the row SHALL show the summed input/output/total tokens and cost, AND a per-purpose breakdown attributing tokens to `chat` and `workout_generation`

### Requirement: Usage events are retention-pruned

The SPA SHALL bound the synced log by pruning events older than a retention window (12 months) through a tombstoning delete, so the delete propagates cross-device and the snapshot stays bounded. Pruning runs from the once-per-session database maintenance hook.

#### Scenario: Old events are pruned and tombstoned

- **GIVEN** the log contains events older than the retention window and events within it
- **WHEN** the maintenance prune runs
- **THEN** the out-of-window events SHALL be deleted and tombstoned, and the in-window events SHALL remain
