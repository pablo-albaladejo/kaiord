## Why

Issue #1651 (parent #1670, story 78, Implementation Decisions "Assistant":
"Cost is priced per model and counts failed attempts"). The cost the athlete
saw for a run of the assistant was not the real one:

- It was a blended rate per Provider ($3, $1.50 or $0.30 per million tokens,
  input and output alike), whatever the model, last reviewed 2026-04-18.
  Claude Haiku 4.5 and Claude Opus 5 cost the same; output, which costs five
  to eight times input, cost the same as input.
- Only the attempt that passed was counted. A validation retry, a reply cut at
  the token limit and a run that failed after every attempt were billed by the
  Provider and shown as nothing: the sink dropped `run_failed` events and the
  generate loop kept only the winning attempt's usage.
- A model with no rate, or an unmapped Provider, was recorded at cost `0`,
  which the panel showed as free.

## What Changes

- **Every billed request is reported.** The agent runtime and the chat engine
  list every request that reached the Provider on their telemetry events
  (`requests`): each attempt of a generate run with its outcome (`ok`,
  `invalid`, `truncated`, `error`, `stopped`) and each step of a chat turn,
  with the usage the Provider reported, cache reads and writes included. A
  request the Provider reported no usage for (a failure before the final
  chunk) is listed without usage: unmeasured, never zero.
- **A price table per model.** `@kaiord/ai/providers` ships
  `model-prices.json`: input, output, cached-input and cache-write prices per
  million tokens for every model the App offers, read on 2026-11-23 from each
  Provider's official pricing page, with that page and date on every entry,
  dated price changes and long-context tiers. A model the page does not list
  is `unpriced`, with the reason. `priceRun` prices a run request by request
  and returns the cost record a Trace (#1652) carries.
- **A guard keeps it true.** `pnpm lint:model-prices` fails when a model in
  the catalog has no entry, an entry is older than 120 days or dated in the
  future, or an entry names a model the App no longer offers.
- **The App shows the real cost and its basis.** Each `usageEvents` row is
  priced per request at its model's prices, failed runs included, and stores
  the basis (`price_table` or `unknown`), the date the price was read and the
  request counts. The Usage tab adds cost by model with the prices used and a
  link to the price list, marks runs at an unknown price instead of adding
  zero, and says which requests could not be counted. The assistant card
  shows its model's prices. The batch estimate uses the model's own input and
  output prices. English and Spanish.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ai-observability`: run and chat events list every billed request.
- `ai-providers`: a per-model price table with its freshness guard.
- `spa-ai-usage-telemetry`: rows priced per model, failed runs recorded, the
  basis stored and shown.
- `spa-ai-batch`: the estimate priced at the model's own prices.

## Impact

- `packages/ai`: `agents/` (attempt usage, loop, runtime), `chat/` (turn
  stats), `observability/telemetry-types.ts`, `providers/pricing/`.
- `packages/workout-spa-editor`: usage writer, sink, fold, Settings usage and
  assistant views, batch estimate; `provider-rates.ts` deleted.
- `scripts/check-model-prices.mjs` (new, with test), wired in `pnpm lint`.
- Public surfaces: no registered claim states a cost, so `pnpm lint:claims`
  is unaffected.
