---
"@kaiord/ai": minor
"@kaiord/workout-spa-editor": minor
---

The cost of a run of the assistant is the real one: priced per model, with retries and failed attempts included.

- `@kaiord/ai`: every telemetry event lists the requests it sent to the Provider (`requests: AiRequest[]`). A generate run lists each attempt with its outcome (`ok`, `invalid`, `truncated`, `error`, `stopped`), and a chat turn lists each model step. Each request carries the usage the Provider reported, cache reads and writes included. A request the Provider reported no usage for carries none. `run_finished.usage` and `GenerateAgentResult.usage` are now the sum over every attempt, not only the one that passed, and `run_failed` carries its billed attempts.
- `@kaiord/ai/providers` exports `priceRun`, `findModelPrice`, `periodAt` and `MODEL_PRICES`. They price a run from a per-model table of input, output and cache prices, read on 2026-11-23 from each Provider's official pricing page. The table has dated price changes and long-context tiers. A model the page does not list has an unknown price (`usd: null`) rather than a guessed one.
- Kaiord App: the Usage tab shows cost by model, with the prices used, the date they were read and a link to the price list. A run whose model has no price is shown as unknown and counted beside the total, not added as zero. A request the Provider reported no usage for is said to be uncounted. The assistant card shows its model's prices, and the batch estimate uses the model's own input and output prices. Failed runs are recorded. Usage recorded before this change is priced again per model. In English and Spanish.
