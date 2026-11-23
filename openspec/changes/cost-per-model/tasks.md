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

## 6. Review fixes

- [x] 6.1 A cut request (Stop, watchdog, dropped stream) is estimated and labelled; a watchdog timeout is a failed request (`runtime.cut-cost.test.ts`, `run-turn.cut-cost.test.ts`, `price-run.test.ts`, `UsageTab.test.tsx`)
- [x] 6.2 `usageEvents` device-local, no `traceId`, v39 upgrade (`usage-stays-on-device.test.ts`, `dexie-v39-migration.test.ts`); privacy policy and the kept-on-device inventory say so
- [x] 6.3 The batch estimate prices each workout as its own request with the system prompt (`use-batch-cost-estimate.test.ts`, Haiku 5.5 at 100K)
- [x] 6.4 Each price entry carries `quote`; a renewed entry must quote every price (`scripts/lib/model-price-entry.test.mjs`)
- [x] 6.5 One Provider list (`LLM_PROVIDER_TYPES`), one `sumUsage`, `runCostSchema` exported by `@kaiord/ai`, no `cost: 0` for an unknown price
