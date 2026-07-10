# Proposal: Migrate usage accounting onto the telemetry port (dual-write + parity)

## Why

Wave 2 (`add-lab-extraction-agent`) shipped the telemetry port
(`@kaiord/ai/observability`: `AiTelemetrySink`, `run_finished`/`run_failed`)
but nothing in the SPA consumes it yet. Token accounting today is a single
hand-wired path: only the chat turn writer (`recordChatUsage`) folds usage into
the monthly Dexie `usage` row. Every other model run — workout generation, the
batch pipeline that reuses it, and the new lab extraction — is invisible to the
`usage` table _by construction_, because those call sites never touch
`recordChatUsage`. As a result the Settings → Usage panel under-counts real
consumption, and each new AI feature must remember to bolt on its own writer.

The telemetry port exists precisely to make usage a cross-cutting concern
instead of a per-feature chore: the agent runtime already emits exactly one
`run_finished` event per run carrying provider-reported token counts, and
`runGenerateAgent` already accepts a sink. What is missing is a SPA-side sink
that persists those events and a safe path to make an event fold — rather than
the hand-wired chat writer — the source of truth for the panel.

Because the monthly `usage` row is **shared, user-visible state** (rendered by
`UsageTab`/`UsageTable`, cost via `estimateCost`/`getProviderRate`, and included
in the cloud snapshot), this change does **not** cut the writer over. It stands
up the event log alongside the legacy writer (**dual-write**), proves the two
agree over a real session (**parity**), and only then — in a separate follow-up
change — flips the reader and deletes the legacy writer. This change is the
"prove it is safe" half.

## What Changes

- **New Dexie event-log store `usageEvents` (v32, additive, device-local)**: an
  append-only, redaction-safe log of per-run usage — ids and metrics only
  (`{ id, traceId, yearMonth, date, purpose, providerType, modelId,
promptTokens, completionTokens, tokens, cost, createdAt }`), never prompts,
  document bytes, model output, or keys. Keyed by `id` with a
  `[yearMonth+purpose]` index for the monthly fold. Auto-created empty on
  upgrade; added to the snapshot `DEVICE_LOCAL` exclusion set (a transition
  artifact — see design.md for why cross-device roll-up is deferred to the
  cutover).
- **New `UsageEventRepository` port + Dexie adapter**: `append(row)` and
  `listByMonth(yearMonth)`, wired into the `PersistencePort` alongside the
  existing `usage` repository. Writing through the port (not the store
  directly) keeps the no-Zustand-write-through guard and hexagonal direction
  intact.
- **`appendUsageEvent` application writer + `foldUsageEvents` pure fold**: the
  single awaitable writer that both the telemetry sink and the chat path call,
  and the pure function that reduces a month's events into
  `{ inputTokens, outputTokens, totalTokens, totalCost }` for the parity check
  (and, later, for the panel). Cost reuses the exact
  `estimateCost(tokens, getProviderRate(providerType))` formula the legacy
  writer uses, and applies the same zero-token skip.
- **`createDexieUsageTelemetrySink(persistence)` SPA adapter**: implements
  `AiTelemetrySink`; on `run_finished` with usage it maps the SDK provider
  string to `LlmProviderType`, computes cost, and appends a `usageEvents` row
  fire-and-forget (telemetry must never block or fail a run); no-ops on
  `run_failed` or missing usage.
- **Instrument the unaccounted run sites (the side benefit)**: pass the sink
  into `runLabExtraction`'s `runGenerateAgent` call, and thread an optional
  `telemetry` passthrough through the deprecated `createTextToWorkout` wrapper
  so `generateWorkoutKrd` (and the batch pipeline that reuses it) emit through
  the same port. These runs are currently unaccounted, so emitting them adds
  no double-count risk.
- **Dual-write for chat**: `appendAssistantTurn` keeps calling `recordChatUsage`
  (authoritative — still the only writer of the live `usage` row) and, in
  parallel, calls `appendUsageEvent` with `purpose: "chat"`. No user-visible
  change: `UsageTab` still reads the legacy `usage` table.
- **Parity test**: over a simulated multi-turn session, assert the chat-scoped
  `foldUsageEvents(events, { purpose: "chat" })` equals the live `usage` row —
  token counts exactly, cost within a documented floating-point tolerance.
- **Explicitly NOT in this change** (a separate follow-up): flipping
  `UsageTab`/`UsageTable` to read the event fold, deleting `recordChatUsage`,
  extending the panel to a per-purpose/per-model breakdown, and the
  cross-device roll-up decision for the (currently device-local) event log.

## Capabilities

### New Capabilities

- `spa-ai-usage-telemetry`: the SPA usage event log and its Dexie sink — the
  redaction-safe `usageEvents` store, the `appendUsageEvent` writer and
  `foldUsageEvents` fold, the `AiTelemetrySink` Dexie adapter, run-site
  instrumentation (generation, batch, lab extraction), the chat dual-write, and
  the fold-vs-legacy parity invariant that gates the future cutover.

### Modified Capabilities

- None. The legacy writer's behavior is unchanged, so `spa-ai-batch`'s "Monthly
  AI usage tracking" requirement stays literally true during the transition;
  the follow-up cutover change is what will modify it (flip the reader, retire
  the writer). `ai-observability` (the port) is consumed as-is, not modified.

## Impact

- **Packages**: `@kaiord/workout-spa-editor` (private — new store, port,
  adapter, writer/fold, sink, run-site wiring, chat dual-write, parity test).
  `@kaiord/ai` (public — one additive minor: an optional `telemetry` field on
  `TextToWorkoutConfig`, forwarded to the runtime the deprecated wrapper
  already delegates to; no behavioral change). Changeset for `@kaiord/ai` only.
- **Persistence**: Dexie **v32** — a single additive store (`usageEvents`), no
  data transform, no change to existing stores or indexes. `usage` (v-early,
  PK `yearMonth`) is untouched and stays authoritative. The new store is
  device-local (excluded from the snapshot).
- **Hexagonal layers**: new port (`UsageEventRepository`) declared before its
  Dexie adapter; the sink is an adapter; `appendUsageEvent`/`foldUsageEvents`
  are application-layer (pure/awaitable, unit-testable). SPA `application/`
  still imports workspace packages only; the `@ai-sdk/*` containment guard is
  unaffected. The provider→`LlmProviderType` map is a small, tested helper.
- **Public API**: additive only. `createTextToWorkout` gains an optional
  passthrough field and keeps its signature and `AiParsingError` semantics;
  `runGenerateAgent`'s existing `telemetry` config is used as-is.
- **Data integrity**: the live `usage` row keeps exactly one writer during the
  transition (`recordChatUsage`); the event log is a parallel, non-authoritative
  mirror. Parity is proven before any cutover is proposed.
- **Tests**: new unit suites for the store/migration (v32), the port adapter,
  `appendUsageEvent` (including the zero-token skip), `foldUsageEvents`, the
  provider map, the Dexie sink (fire-and-forget, failure/no-usage no-op), the
  chat dual-write, and the fold-vs-legacy parity session. Coverage thresholds
  unchanged (80/70).
- **Referenced specs**: `spa-ai-batch` (Monthly AI usage tracking — consumed,
  unchanged), `ai-observability` (telemetry port — consumed), `ai-agents`
  (runtime sink parameter — consumed), `spa-persistence-port` and
  `hexagonal-arch` (new port follows the existing repository pattern).
