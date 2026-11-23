## 1. Proofs, red first

- [x] 1.1 `price-run.test.ts`: per-model prices, cache prices, a failed attempt costs more, long-context tier, price in force on the day, unknown price never zero, unmeasured request
- [x] 1.2 `runtime.cost.test.ts`: validation retry, failed run, Provider failure with no usage, streamed invalid and truncated attempts, cache tokens
- [x] 1.3 `chat-agent.cost.test.ts`: each tool-loop step is a request; a failed step with no usage is unmeasured
- [x] 1.4 `check-model-prices.test.mjs`: missing entry, stale (120 days), future, orphan, duplicate, malformed, empty catalog, unreadable table
- [x] 1.5 App sink and writer: per-model cost, failed run recorded, a failed attempt costs more, unmeasured, unknown basis
- [x] 1.6 App views: cost by model with its basis, unknown price, notes; assistant card price; batch estimate
- [x] 1.7 E2E `ai-usage-cost.spec.ts`: a run with a failed attempt against a stubbed Provider costs more than a clean one; the Usage tab shows its cost by model and basis

## 2. `@kaiord/ai`

- [x] 2.1 `AiRequest` on every telemetry event; `usage` sums all requests
- [x] 2.2 Generate loop reports each attempt with the usage attached to its error
- [x] 2.3 Chat turn stats count started and finished steps
- [x] 2.4 `model-prices.json` read on 2026-11-23 from the three official pages; `priceRun`, `findModelPrice`, `periodAt`

## 3. Kaiord App

- [x] 3.1 `usageEvents` cost summary fields; `appendUsageEvent` prices requests; sink records `run_failed`
- [x] 3.2 Fold re-prices old rows and counts unknown and unmeasured; cost by model
- [x] 3.3 Usage tab, assistant card and batch estimate show the per-model cost and basis (en, es)
- [x] 3.4 `provider-rates.ts` and the blended estimate removed

## 4. Guards and docs

- [x] 4.1 `pnpm lint:model-prices` wired in `pnpm lint`; `scripts/README.md`, `CLAUDE.md`
- [x] 4.2 Changesets for `@kaiord/ai` and the App

## 5. Quality gates

- [x] 5.1 `pnpm lint`, `pnpm test:scripts`, `@kaiord/ai` tests, App unit suite, usage and settings E2E, `pnpm lint:claims`
- [x] 5.2 `openspec validate cost-per-model --strict`
