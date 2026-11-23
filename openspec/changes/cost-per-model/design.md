## Context

The assistant's cost is shown in Settings (the Usage tab and the assistant
card) and before a batch. Chat shows no cost today. Usage reached the App as
one `{ promptTokens, completionTokens }` per run, from the attempt that
passed. #1652 adds a Trace the athlete can read, with the cost of each run, so
the cost record has to survive per run, not only as a monthly sum.

## Decisions

### D1. The unit priced is the request, not the run

Long-context tiers (Claude Haiku 5.5 above 100K prompt tokens, Gemini 2.5 Pro
and 3.1 Pro above 200K, OpenAI's newer models above 272K input tokens) apply
to each request on its own, so a run is priced request by request and summed.
The telemetry events carry `requests: AiRequest[]`, where
`AiRequest = { outcome, usage? }`. For a generate run, one request per
attempt; for a chat turn, one per model step (`onStepStart` counts the steps
begun, `onStepEnd` closes them with their usage).

### D2. A cut request is estimated; an error before any output is unmeasured

A Provider reports usage with the final chunk or the response body. The
installed AI SDK (ai 7.0.143, @ai-sdk/anthropic 4.0.82, openai 4.0.96, google
4.0.99) exposes nothing earlier: `onStepEnd` and `onLanguageModelCallEnd`
fire only on a step's `finish` part, `onAbort` hands back only the finished
steps, and the Anthropic provider keeps the `message_start` input count to
itself until `finish`. Provider-specific raw chunks (`includeRawChunks`) were
not used: they differ per Provider and are not part of the SDK's contract.

A request cut before its final chunk (a Stop, the chat watchdog, a stream
dropped after output began) was billed all the same, so counting it as $0
understated the cost. It is listed with `estimated: true` and a usage of
`ceil(chars / 3)` tokens: input from the request's text (system prompt and
messages; documents and images left out, since they are billed by their own
rule), output from the text, reasoning and tool input streamed before the
cut. Only the character counts reach the cost path, never the text. A Stop
stays `stopped`; the watchdog and a dropped stream are `error`, a failure.
A one-shot (non-streamed) attempt the athlete stops is estimated from its
input alone.

A request the Provider answered with an error before any output (a 4xx/5xx)
reports no usage, is not billed, and stays unmeasured: listed with no
`usage`, counted in `unmeasuredRequests`, adding nothing. A request that
failed after the Provider returned usage (an output that did not validate, a
reply cut at the token limit) is counted in full.

Rejected: leaving every cut request unmeasured (the first version of this
decision). The review showed a cut request reads as $0 while the Provider
bills it. Rejected: estimating every failed request, HTTP errors included: it
would charge for requests the Provider did not bill.

### D3. The price table is data, read from the official pages

`model-prices.json` lists entries `{ provider, ids, source, readOn, periods |
unpriced }`. A period is `{ from?, input, output, cacheRead?, cacheWrite?,
longContext? }` in USD per million tokens; the period in force on the day of
the run applies (Gemini 4 Argon doubles on 2026-12-01, Gemini 3.6 and 3.8
Flash on 2027-01-01, and Gemini 2.5 Pro bills as 3.8 Flash from 2026-12-01).
A missing `cacheRead` or `cacheWrite` means the Provider bills those tokens
as ordinary input. Cache writes are priced at the shortest-lived cache's write
price (Anthropic's 5-minute, OpenAI's 30-minute), since the App never asks
for a longer cache.

A dated snapshot id shares its alias's entry only for models whose page row
is that model (`claude-haiku-4-5-20251001` is Claude Haiku 4.5). The three
dated `gpt-4o` snapshots are `unpriced`: the page lists only `gpt-4o`, and a
snapshot is not shown to bill the same.

The models the pages did not list on 2026-11-23 are `unpriced`, and the App
shows "Price unknown" for them rather than a guess:

- OpenAI: `o1`, `o3-mini`, `o4-mini`, `gpt-4.1-nano`, the `gpt-3.5-turbo`
  family, the four `*-chat-latest` ids, `gpt-5.6`, and the dated `gpt-4o`
  snapshots.
- Google: `gemini-2.0-flash` and `-lite`, `gemini-3-pro-preview`,
  `gemini-3.1-flash-lite-preview` (the page lists `gemini-3.1-flash-lite`),
  `gemini-3.5-flash`, `gemini-3.7-flash`, the three `*-latest` aliases (the
  page does not say what they point to), `aqa` and the Gemma 3 models.

### D4. The cost record a Trace carries

`priceRun({ provider, modelId, requests, at })` returns

```ts
type RunCost = {
  provider?: LlmProviderType;
  modelId: string;
  requests: Array<AiRequest & { usd: number | null }>;
  usage: { promptTokens; completionTokens; cacheReadTokens; cacheWriteTokens };
  usd: number | null; // null when the model's price is unknown
  failedRequests: number; // invalid, truncated or error; a stop is not a failure
  unmeasuredRequests: number;
  estimatedRequests: number;
  basis:
    | { kind: "price_table"; source: string; readOn: string }
    | {
        kind: "unknown";
        reason: "unknown_provider" | "unknown_model" | "unpriced_model";
      };
};
```

`RunCost` is `runCostSchema` in `@kaiord/ai/providers`, which the App's
Trace schema embeds rather than copying; its Provider and outcome enums come
from `LLM_PROVIDER_TYPES` and `AI_REQUEST_OUTCOMES`. #1652 stores it as is on
each Trace, on the device. The `usageEvents` row keeps only the summary
(`cost`, `costBasis`, `priceReadOn`, `requestCount`, `failedRequests`,
`unmeasuredRequests`, `estimatedRequests`, cache token counts), all optional
so rows written before this change still parse. A row with an unknown price
has no `cost`, rather than a `cost: 0` that reads as free.

### D5. Old rows are priced again on read

A row written before this change has no `costBasis` and a blended-rate cost.
The fold prices it again from its own model and tokens, as one request on the
day it was written; a row with no model id has an unknown price. Its failed attempts were never recorded and
cannot be recovered.

### D6. The usage log stays on the device

`usageEvents` was synced and backed up, and each row carried its Trace's id
(`trace.sink` forwarded every event under it). A row per run, with its time,
model, cost and request counts, describes what the athlete did with the
assistant as much as a Trace does, and the Traces are never sent. Since v39
the log is device-local like `traces`: in `DEVICE_LOCAL_TABLES`
(`application/sync/device-local-tables.ts`, which the snapshot port's
`DEVICE_LOCAL` set is built from), `exclude` in the backup policy, and
dropped, with its tombstones, from a remote snapshot or a backup file before
the merge, so an earlier build's rows are neither imported nor pushed back.
`trace.sink` forwards each event unchanged; no row names a Trace, and the
v39 upgrade strips the `traceId` already stored. The prune writes no
tombstone. The Usage tab and the assistant card say they show this device's
usage, and the data-flow inventory lists the log as kept on this device.

Rejected: syncing only a monthly aggregate. Two devices writing the same
month need a merge rule (sum, or last write wins, both wrong for some case),
and a monthly total of runs still describes the athlete's activity.

### D7. The batch estimate is priced per request

The batch sends one request per workout, each with the workout-parser system
prompt. The estimate used to price the whole batch as one request without
the system prompt: it left out a few thousand input tokens per workout and,
on a model with a long-context tier (Claude Haiku 5.5 above 100K input
tokens), priced a batch of small requests at the long-context price.
`estimateWorkoutRequests` now returns one input/output split per workout,
the system prompt's characters included, and `priceRun` prices each on its
own.

### D8. A renewed price quotes its page

A guard on `readOn` alone passed a wrong price whose date was bumped. Each
entry carries `quote`, the exact line(s) of the official page; a priced entry
read after 2026-11-23 must carry one in which every number of its periods
appears (`scripts/lib/model-price-entry.mjs`). The 39 entries read on
2026-11-23 carry `quote: null`: the table kept no quotes then, the pages
cannot be read again offline, and a quote is never retyped from memory.
Their `readOn` stays frozen; at 120 days they expire and renewing each one
requires its quote. The check never fetches a page.
