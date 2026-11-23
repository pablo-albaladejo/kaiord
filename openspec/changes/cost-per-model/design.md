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

### D2. A request with no usage is unmeasured, and labelled so

A Provider reports usage with the final chunk or the response body. A request
that fails before it (a 4xx/5xx answer, a dropped stream, an abort, the
watchdog) reports none. Such a request is listed with no `usage`, counted in
`unmeasuredRequests`, adds nothing to the cost, and the Usage tab says how
many requests it could not count. It is not estimated: an HTTP error answered
before generation is not billed by the Providers, and an estimate from the
request size would overstate those, which are the common case. A request that
failed after the Provider returned usage (an output that did not validate, a
reply cut at the token limit) is counted in full.

Rejected: estimating input tokens from the request size. It would need the
prompt text in the cost path, which the redaction rule keeps out of telemetry,
and would charge for requests the Provider did not bill.

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
  basis:
    | { kind: "price_table"; source: string; readOn: string }
    | {
        kind: "unknown";
        reason: "unknown_provider" | "unknown_model" | "unpriced_model";
      };
};
```

#1652 stores it as is on each Trace, on the device. The synced `usageEvents`
row keeps only the summary (`cost`, `costBasis`, `priceReadOn`,
`requestCount`, `failedRequests`, `unmeasuredRequests`, cache token counts),
all optional so rows written before this change still parse.

### D5. Old rows are priced again on read

A row written before this change has no `costBasis` and a blended-rate cost.
The fold prices it again from its own model and tokens, as one request on the
day it was written; a row with no model id has an unknown price. Its failed attempts were never recorded and
cannot be recovered.
