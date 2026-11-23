## MODIFIED Requirements

### Requirement: Usage events are retention-pruned

The SPA SHALL bound this device's log by pruning events older than a retention window (12 months). The log never leaves the device, so the delete writes no tombstone. Pruning runs from the once-per-session database maintenance hook.

#### Scenario: Old events are pruned and tombstoned

- **GIVEN** the log contains events older than the retention window and events within it
- **WHEN** the maintenance prune runs
- **THEN** the out-of-window events SHALL be deleted, with no tombstone (the scenario keeps its name; nothing is tombstoned), and the in-window events SHALL remain

### Requirement: The usage panel renders the monthly fold with a per-purpose breakdown

The Settings usage panel SHALL say that it shows this device's usage (the log is not in Drive sync or a backup file), SHALL read `usageEvents` for the current month plus the previous five and render each month's folded totals (input, output, total tokens, cost), plus a per-purpose breakdown (chat, workout_generation, lab_extraction). It SHALL read live via `useLiveQuery`; months with no events SHALL NOT render. A row without `costBasis` SHALL be priced again at its model's own prices on the day it was written. A run at an unknown price SHALL add nothing to a cost and SHALL be counted beside it ("+ 1 run at an unknown price"); a month or model whose every run has an unknown price SHALL show "—", never $0. Below the months the panel SHALL show the cost by model (runs, failed attempts, tokens, cost, and the current prices per million tokens with the date they were read and a link to the price list, or "Price unknown"), a note that the cost includes every attempt the Provider billed, and, when there are any, how many requests were cut before the Provider reported their usage and are priced at an estimate (a cost that includes one SHALL say "includes an estimate"), and how many requests failed before the Provider reported their usage and are not counted. The assistant card SHALL show its model's prices the same way. All copy SHALL come from the `en` and `es` dictionaries.

#### Scenario: Panel folds the log per month

- **GIVEN** a month with chat and workout_generation events
- **WHEN** the usage panel renders that month
- **THEN** the row SHALL show the summed input/output/total tokens and cost, AND a per-purpose breakdown attributing tokens to `chat` and `workout_generation`

#### Scenario: Cost by model shows its basis

- **GIVEN** a priced run on `claude-sonnet-5`
- **WHEN** the usage panel renders
- **THEN** its model row SHALL show "Claude Sonnet 5", the cost, "$2.00 input · $10.00 output · $0.20 cached input per million tokens", the date read and a "Price list" link to Anthropic's pricing page

#### Scenario: An unknown price is not shown as free

- **GIVEN** a run on `o1` recorded with `costBasis: "unknown"`
- **WHEN** the usage panel renders
- **THEN** its model row SHALL say "Price unknown" and its month SHALL say "+ 1 run at an unknown price"

## REMOVED Requirements

### Requirement: Usage aggregates cross-device by append-only union

**Reason**: The usage log no longer leaves the device, so there is nothing to merge across devices.
**Migration**: Each device shows its own usage ("Redaction-safe usage event log kept on this device"); rows an older build pushed to Drive are dropped from the remote snapshot before the merge and never pushed back.

### Requirement: Redaction-safe usage event log

**Reason**: It made the usage log synced and backed up, with each row naming its Trace, while the Traces are never sent.
**Migration**: Replaced by "Redaction-safe usage event log kept on this device", which keeps the same fields minus `traceId`, plus `estimatedRequests`, and makes the store device-local; the v39 upgrade strips `traceId` from stored rows.

### Requirement: Single writer applied through a repository port

**Reason**: It priced a run as `estimateCost(tokens, getProviderRate(providerType))`, a blended rate per Provider, and skipped a run by its token count.
**Migration**: Replaced by "Single writer prices every request at its model's prices", which keeps the single writer and its port and prices each request with `priceRun`.

### Requirement: Telemetry sink folds runtime events into the log

**Reason**: It dropped `run_failed` events and recorded an unmapped Provider at `cost: 0`, so billed failed attempts were lost and an unknown price read as free.
**Migration**: Replaced by "Telemetry sink records every billed request", which records `run_failed` and an unknown cost as `costBasis: "unknown"`.

## ADDED Requirements

### Requirement: Redaction-safe usage event log kept on this device

The SPA SHALL persist AI token usage as an append-only Dexie event log (`usageEvents`) that carries identifiers and metrics only — never prompts, document bytes, model output, or API keys. Each row records `{ id, yearMonth, date, purpose, providerType, modelId, promptTokens, completionTokens, tokens, cost, createdAt }`, with `tokens = promptTokens + completionTokens` and non-negative integer counts, plus the optional cost summary `{ cacheReadTokens, cacheWriteTokens, costBasis, priceReadOn, requestCount, failedRequests, unmeasuredRequests, estimatedRequests }`, enforced by a `.strict()` schema parsed at the single write boundary. `costBasis` is `price_table` (priced from the table read on `priceReadOn`) or `unknown` (the model or Provider has no price; the row then has no `cost` at all, and the schema SHALL reject a row whose `cost` presence disagrees with its basis). A row without `costBasis` was written at the old blended rate. A row SHALL NOT name a Trace. The log is the authoritative usage store and is **device-local**: it is in the snapshot port's device-local set and `exclude` in the backup policy, so neither the Drive sync snapshot nor a backup file carries it, and a `usageEvents` table or tombstone that an older snapshot or file still carries is dropped on import and never pushed back. The v39 upgrade strips `traceId`, and the `cost: 0` of an unknown price, from stored rows. Its 12-month retention prune writes no tombstone. There is no separate `usage` table.

#### Scenario: Event row is shape-valid and payload-free

- **WHEN** a usage event is appended with one request of `promptTokens: 120` and `completionTokens: 80`
- **THEN** the row SHALL have `tokens` equal to `200`, and the schema SHALL reject any row carrying prompt text, document bytes, model output, or credential fields

#### Scenario: The log stays on this device

- **GIVEN** a device holding usage rows and Traces, and a Drive snapshot pushed by an earlier build that carries `usageEvents` rows naming a Trace and a `usageEvents` tombstone
- **WHEN** the device syncs, and when it exports a backup file
- **THEN** neither the pushed snapshot nor the file SHALL carry a `usageEvents` or `traces` table, a `usageEvents` tombstone, or a `traceId`, and the remote rows SHALL NOT be imported

#### Scenario: An old backup file's usage rows are ignored

- **WHEN** a backup file that carries `usageEvents` rows is imported
- **THEN** this device's usage log SHALL be unchanged

### Requirement: Single writer prices every request at its model's prices

The SPA SHALL write `usageEvents` only through `appendUsageEvent`, the single application-layer writer, over the `UsageEventRepository` port. It is THE authoritative usage writer — there is no legacy `usage` row and no dual-write. It takes the run's `requests`, prices them with `priceRun` from `@kaiord/ai/providers` at the model's own prices on the day of the run, failed attempts included, and skips a run that made no request. Agent runs and chat turns both reach it via the Dexie telemetry sink; chat turns record `purpose: "chat"`.

#### Scenario: Cost per model and no-request skip

- **WHEN** `appendUsageEvent` records an `anthropic` run on `claude-sonnet-5` with one request of 120 input and 80 output tokens
- **THEN** the stored `cost` SHALL be $0.00104 with `costBasis: "price_table"` and `priceReadOn` the table's date, and a run with no request SHALL write nothing

#### Scenario: A chat turn writes one usage event through the sink

- **GIVEN** a chat turn with two finished steps on provider `anthropic.messages`
- **WHEN** its `chat_turn_finished` event reaches the Dexie sink — whatever its status, a stopped or paused turn included
- **THEN** exactly one `usageEvents` row with `purpose: "chat"`, `requestCount: 2` and no `traceId` SHALL be appended, and persisting the assistant message SHALL write no usage row of its own

### Requirement: Telemetry sink records every billed request

The SPA SHALL provide `createDexieUsageTelemetrySink(persistence)` implementing
`AiTelemetrySink`. On a `run_finished`, a `run_failed` or a
`chat_turn_finished` event (as `purpose: "chat"`) that lists at least one
request, it SHALL map the SDK provider string to an `LlmProviderType` and
append a `usageEvents` row through `appendUsageEvent`. It SHALL no-op on an
event with no request. Persisting SHALL be best-effort: a write error SHALL be
swallowed (logged) and SHALL NOT propagate into the model run.

#### Scenario: Finished run with usage is recorded

- **GIVEN** a Dexie sink over an empty log
- **WHEN** it receives a `run_finished` event with `purpose: "lab_extraction"`, provider `anthropic.messages`, model `claude-sonnet-5` and one request of `{ promptTokens: 300, completionTokens: 120 }`
- **THEN** a `usageEvents` row SHALL be appended with `providerType: "anthropic"`, `tokens: 420`, and `cost` $0.0018

#### Scenario: Failed run is recorded with every billed attempt

- **WHEN** the sink receives a `run_failed` event listing three `invalid` requests of 300 input and 120 output tokens each
- **THEN** one row SHALL be appended with `tokens: 1260`, `requestCount: 3` and `failedRequests: 3`

#### Scenario: A run with a failed attempt costs more than the same run without it

- **GIVEN** two `run_finished` events on `claude-sonnet-5`, one with an `ok` request and one with an `invalid` request of the same usage before the same `ok` request
- **WHEN** the sink records both
- **THEN** the second row's `cost` SHALL be twice the first's

#### Scenario: A request with no usage is unmeasured

- **WHEN** a run's requests include one with no `usage`
- **THEN** its row SHALL count it in `unmeasuredRequests` and add nothing for it to `cost`

#### Scenario: Persistence error does not surface into the run

- **GIVEN** a sink whose append rejects
- **WHEN** it receives a `run_finished` event with usage
- **THEN** `emit` SHALL NOT throw, and the failure SHALL be logged rather than propagated

#### Scenario: Unmapped provider or unpriced model keeps usage with an unknown cost

- **WHEN** a `run_finished` event carries a provider string that maps to no `LlmProviderType`, or a model the price table marks `unpriced`
- **THEN** the row SHALL still record the token counts, with `costBasis: "unknown"` and no `cost`, rather than dropping the event or recording it as free

#### Scenario: A cut request is priced at its estimate and labelled

- **WHEN** a run's requests include one with `estimated: true`
- **THEN** its row SHALL count it in `estimatedRequests` and price its estimated usage, and the Usage tab SHALL say the cost "includes an estimate"
