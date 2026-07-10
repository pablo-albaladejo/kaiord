# Design: Usage accounting on the telemetry port

## Context

- Today `recordChatUsage(persistence, { providerType, promptTokens,
completionTokens })` (application layer) reads-modifies-writes the monthly
  `usage` row (Dexie store `usage`, PK `yearMonth`, shape `UsageRecord =
{ yearMonth, inputTokens, outputTokens, totalTokens, totalCost, entries[] }`)
  inside one transaction. It is called from exactly one place:
  `appendAssistantTurn` in `application/chat/append-turn-messages.ts`.
- `UsageTab`/`UsageTable` read the `usage` store directly via `useLiveQuery`
  (`db.table("usage").where("yearMonth").anyOf(window)`); cost is the stored
  `totalCost`. The `usage` store is in the cloud snapshot (not device-local).
- The agent runtime (`runGenerateAgent`) already emits one telemetry event per
  run and already accepts `config.telemetry?: AiTelemetrySink`. Its
  `run_finished` event carries `usage?: { promptTokens, completionTokens }`,
  plus `provider` (SDK string, e.g. `anthropic.messages`), `modelId`,
  `purpose`, `traceId`, `latencyMs`, and prompt/agent ids/versions.
- Run sites: `runLabExtraction` calls `runGenerateAgent(...)` with no sink;
  `generateWorkoutKrd` calls the deprecated `createTextToWorkout({ model })`
  wrapper (which internally delegates to `runGenerateAgent` with `{ model,
logger }` — no telemetry) and the batch pipeline reuses `generateWorkoutKrd`.
  Chat does **not** use the agent runtime; it has its own path and calls
  `recordChatUsage` directly.

## Goals / Non-goals

- **Goal**: stand up an event-log usage path in parallel with the legacy
  writer, instrument the currently-unaccounted runs, and prove the event fold
  agrees with the legacy `usage` totals for chat — without changing anything
  the user sees or the authority of the live `usage` row.
- **Non-goal**: cutting the reader over to the fold or deleting
  `recordChatUsage` (separate follow-up, gated on the parity proven here);
  per-purpose/per-model panel breakdown; document/payload capture.

## Key decisions

### D1 — Event log as a separate store, not a second writer of `usage`

The issue asks to "assert the event-fold equals the legacy `usage` totals." For
that assertion to be meaningful (non-circular) the fold must be computed from an
**independent** store, so the sink writes a new `usageEvents` log, never the
live `usage` row. The live row keeps exactly one writer (`recordChatUsage`)
throughout the transition, which is what makes the change data-integrity-safe:
the panel and the snapshot are byte-for-byte unaffected. "Fold into the monthly
`usage` row" from the issue describes the **end state** (post-cutover), reached
by the follow-up change once parity holds.

### D2 — `usageEvents` schema (Dexie v32, additive, device-local)

Store string: `usageEvents: "id, [yearMonth+purpose]"`.

- PK `id` (uuid). `[yearMonth+purpose]` index drives the monthly fold and the
  chat-scoped parity query. No `profileId` (usage is per-device/account, mirror
  of `usage` which is also profile-agnostic), so the store is **not** a
  per-profile cascade target and `isPerProfileTable` does not discover it —
  matching the existing `usage` store.
- Row (redaction-safe by construction — ids and metrics only): `{ id, traceId,
yearMonth, date, purpose, providerType, modelId, promptTokens,
completionTokens, tokens, cost, createdAt }`. Validated by a zod schema
  mirroring `usage-schemas.ts` (`tokens === promptTokens + completionTokens`,
  non-negative ints, `cost >= 0`).
- **Device-local**: added to `DEVICE_LOCAL` in `dexie-snapshot-port.ts`. It is
  a transition/verification artifact; excluding it avoids unbounded per-run row
  growth in the snapshot. **Open question for the cutover** (documented, not
  decided here): the live `usage` row currently syncs across devices, so if the
  fold becomes authoritative the cutover must either (a) include a periodic
  month roll-up in the snapshot, or (b) keep a synced monthly aggregate. Left
  to the follow-up so this change touches no snapshot semantics.

### D3 — One writer, two entry points

`appendUsageEvent(persistence, input)` (application layer, awaitable) is the
only thing that writes `usageEvents`. It applies the **same** guards as the
legacy writer — `if (tokens === 0) return`, `cost = estimateCost(tokens,
getProviderRate(providerType))` — so a chat event and its `recordChatUsage`
counterpart carry identical numbers. Two callers:

- `createDexieUsageTelemetrySink` maps a `run_finished` event to an
  `appendUsageEvent` call (generation, batch, lab extraction).
- `appendAssistantTurn` calls `appendUsageEvent` directly with `purpose:
"chat"` (chat never produces a runtime telemetry event, and fabricating a
  full agent `RunIdentity` for a non-agent path would be a smell — calling the
  shared writer directly is cleaner than forcing chat through the event union).

### D4 — Sink is fire-and-forget; parity tests the awaitable core

`AiTelemetrySink.emit` is synchronous (`(event) => void`) but a Dexie write is
async. The sink therefore schedules the write and swallows errors
(`void appendUsageEvent(...).catch((e) => logger?.warn(...))`) — telemetry must
never block a model run or surface a failure into it. Determinism for tests
comes from exercising the awaitable `appendUsageEvent`/`foldUsageEvents`
directly (and the chat path awaits `appendUsageEvent`), not from timing the
fire-and-forget `emit`.

### D5 — Provider mapping for cost

The event's `provider` is an SDK string, but the rate table is keyed by
`LlmProviderType`. A single tested helper `providerTypeFromSdk(provider):
LlmProviderType | undefined` maps by prefix (`anthropic*` → `anthropic`,
`openai*`/`azure*` → `openai`, `google*`/`gemini*`/`vertex*` → `google`). In the SPA the
model is always a real provider instance, so generation/lab events map cleanly.
Unmapped providers record the row with `cost: 0` (usage stays visible) and a
logged warning rather than dropping the event. Chat does not go through this
helper — it already holds the `LlmProviderType` and passes it straight to
`appendUsageEvent`, so chat cost is by definition identical to `recordChatUsage`.

### D6 — Parity: exact tokens, tolerant cost

`foldUsageEvents` sums events ordered by `createdAt` ascending — the same
chronological order in which the live writer accumulates — so summation order
matches. The parity assertion requires **exact** equality on the integer token
counts (`inputTokens`, `outputTokens`, `totalTokens`) and equality within a
small tolerance (`Math.abs(Δ) <= 1e-9`) on `totalCost`, because floating-point
addition is not associative and a bit-exact cost requirement would be brittle
without buying integrity (cost is explicitly an estimate). The tolerance is
documented in the spec scenario.

### D7 — Generation instrumentation via the wrapper, not a rewrite

`generateWorkoutKrd` keeps using `createTextToWorkout` rather than calling
`runGenerateAgent` directly, because the wrapper owns input validation
(`validateInput`, not exported from `@kaiord/ai`) and the `AiParsingError`
mapping the generation UI depends on. The wrapper gains an optional `telemetry`
field on its config and forwards it to the `runGenerateAgent` call it already
makes — additive, behavior-preserving, and it evaporates when the deprecated
wrapper is eventually removed.

## Risks / trade-offs

- **Double counting if the sink ever wrote `usage`** → avoided by D1 (separate
  store; live row keeps one writer).
- **Snapshot growth** → avoided by D2 (device-local); cross-device authority is
  explicitly deferred to the cutover.
- **FP cost drift** → bounded by D6 (ordered fold + tolerance).
- **Unmapped provider** → D5 records usage with zero cost + warning instead of
  losing data.

## Migration / rollout

Dexie v32 auto-creates `usageEvents` empty; no upgrade transform. Nothing reads
the store in production yet (parity test only), so rollout is inert for users.
The follow-up cutover change will: (1) flip `UsageTab`/`UsageTable` to
`foldUsageEvents`, (2) delete `recordChatUsage` and its call, (3) decide the
device-local vs synced roll-up question, (4) modify `spa-ai-batch`'s Monthly AI
usage tracking requirement.
