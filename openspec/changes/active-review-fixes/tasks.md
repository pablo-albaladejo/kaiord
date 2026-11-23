## 1. Correctness

- [x] 1.1 Garmin: an entry Kaiord did not create is recognized, never moved or deleted, and the athlete is told once (`add-garmin-calendar-scheduling` 10.6)
- [x] 1.2 Garmin: a flickering read never leaves two entries; double click, two tabs, month boundary, partial read (`add-garmin-calendar-scheduling` 10.7)
- [x] 1.3 Service worker: one registry of unsaved work; the silent update and Reload respect it (`add-spa-offline-service-worker`)
- [x] 1.4 TrainingPeaks: notice and refusal honest about the account's time zone (`add-trainingpeaks-workout-push` 6.9, 6.10)
- [x] 1.5 CSP `worker-src` evaluated and decided (`add-spa-offline-service-worker` design)

## 2. What the athlete and the public read

- [x] 2.1 Failures are typed reasons worded from the dictionaries; the App swept for rendered error text; the i18n changeset corrected
- [x] 2.2 Copy lint bypasses closed with rule tests; single letters and file types scoped
- [x] 2.3 A2A described as not deployed; owner's scripts tracked in `packages/mcp-worker/ops/`, dry run by default (`add-a2a-endpoint` 3.1, 6.1, 4.5)
- [x] 2.4 Garmin listing, justification, policy and register say what the code does (`add-garmin-calendar-scheduling` 10.8)

## 3. Structure and standards

- [x] 3.1 One safe-write decision (`application/safe-writes/live-state.ts`) for Garmin and TrainingPeaks; one Garmin live read
- [x] 3.2 Layering: neutral sport values, one `localIsoDate`, one-object `wrap`, required locales, no type re-exports
- [x] 3.3 Root scripts under the 100-line cap, split via sibling modules with tests
- [x] 3.4 Archived i18n change: task count line and the dropped `setLocale` use case

## 4. Quality gates

- [x] 4.1 `pnpm lint`, `pnpm test:scripts`, the touched packages' tests, the e2e and production-build sets, `openspec validate --strict`
