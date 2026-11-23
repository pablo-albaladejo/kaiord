## ADDED Requirements

### Requirement: A price per model read from each Provider's official page

`@kaiord/ai/providers` SHALL ship a price table
(`src/providers/pricing/model-prices.json`) with one entry per group of model
ids of one Provider. Each entry SHALL name the Provider's official pricing
page (`source`) and the day it was read (`readOn`), and SHALL either list
price periods or carry an `unpriced` reason. A period SHALL give USD per
million tokens for input, output and, where the Provider bills them, cached
input (`cacheRead`) and cache writes (`cacheWrite`); it MAY start on a date
(`from`) and MAY carry a long-context tier above a number of input tokens. A
price SHALL be taken only from the Provider's page; a model the page does not
list SHALL be `unpriced`, never given a guessed price.

`priceRun({ provider, modelId, requests, at })` SHALL price each request at
the period in force on the day of `at`, applying the long-context tier when
that request's input tokens exceed its threshold; uncached input, cache reads,
cache writes and output SHALL each be priced at their own price, a missing
cache price meaning ordinary input. It SHALL return a `RunCost` with each
request's cost, the summed usage, `usd` (null when the provider is unknown,
the model is absent from the table, or the model is `unpriced`),
`failedRequests`, `unmeasuredRequests` (requests with no usage, which add
nothing) and the basis (`price_table` with source and date, or `unknown` with
its reason).

`scripts/check-model-prices.mjs` (`pnpm lint:model-prices`, R-ModelPricesFresh)
SHALL fail when a model in the generated catalog has no entry or more than
one, when an entry was read more than 120 days ago or on a future day, when an
entry names a model the catalog does not offer, when an entry has both or
neither of prices and an unpriced reason, and when the catalog parses to no
model or a file cannot be read.

#### Scenario: Two models with the same tokens cost differently

- **WHEN** a run of 1M input and 1M output tokens is priced on `claude-haiku-4-5` and on `gpt-5-mini`
- **THEN** it SHALL cost $6.00 and $2.25

#### Scenario: A run with a failed attempt costs more

- **GIVEN** two runs on `claude-sonnet-5`, one with a single `ok` request of 1,000 input and 500 output tokens, the other with an `invalid` request of the same usage before it
- **WHEN** both are priced
- **THEN** the first SHALL cost $0.007 and the second $0.014

#### Scenario: The price in force on the day applies

- **WHEN** 1M input tokens on `gemini-4-argon` are priced on 2026-11-30 and on 2026-12-01
- **THEN** they SHALL cost $2 and $4

#### Scenario: A model with no price is unknown, not free

- **WHEN** a run on `o1`, which OpenAI's pricing page does not list, is priced
- **THEN** `usd` SHALL be null and the basis `{ kind: "unknown", reason: "unpriced_model" }`

#### Scenario: A stale price fails the guard

- **GIVEN** an entry read 121 days before today
- **WHEN** `pnpm lint:model-prices` runs
- **THEN** it SHALL fail naming that entry
