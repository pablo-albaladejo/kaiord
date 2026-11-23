## 1. The registry

- [x] 1.1 `application/data-flows/`: kinds, destinations, flows; `build-inventory.ts` (tests red first)
- [x] 1.2 `data-flows-coverage.test.ts`: outbound files, the App policy's origins, the extensions' writes, the chat tools, the landing and the privacy policy

## 2. The gate

- [x] 2.1 `lib/health-sharing-store.ts` (localStorage, per Provider) and `lib/health-sharing-gate.ts` (ask, keep, unsaved work while waiting, ask a batch once) (tests red first)
- [x] 2.2 The notice (`HealthSharingNotice`, `HealthNoticeDialog`), mounted in `AppRoot`, English and Spanish (`dataFlows` namespace)

## 3. The paths

- [x] 3.1 Chat: asked after the message is stored and before the agent runs; health tools withheld; replies marked `readHealth` left out of the replay
- [x] 3.2 Generation: asked only when heart-rate data would go; without it, no LTHR and no heart-rate zones; a batch asks once
- [x] 3.3 Lab import: asked before the document goes; "withheld" does not send it and says so

## 4. The inventory

- [x] 4.1 Settings, Privacy: `DataFlowInventory` with `useDestinationStatus` and the per-Provider answer

## 5. Claims and texts

- [x] 5.1 `claims/data-flows.json` registers the `dataFlows` dictionaries and the lab "withheld" message, English and Spanish
- [x] 5.2 The privacy policy's Data Collection section; `scripts/model-facing-sinks.mjs` notes the withheld answer

## 6. Review fixes

- [x] 6.1 A stopped reply that read health, a reply with no `readHealth`, and every reply after the first health-bearing one are not replayed after "don't send" (tests red first)
- [x] 6.2 `create_workout`'s description asks the generation Provider (`assistantWorkout` flow) and is refused on "don't send" (unit and two-Provider end-to-end, red first)
- [x] 6.3 Stop cancels a waiting question; a waiting run keeps a stopped Trace; questions for one Provider share one answer
- [x] 6.4 The coverage guard catches `window.fetch` / `globalThis.fetch` and direct model calls in the App and `@kaiord/ai`; each health flow's content builder is tested against its kinds
- [x] 6.5 Provider list from `LLM_PROVIDER_TYPES`; one `providerName`; the App reaches persistence and the usage sink through the persistence provider
- [x] 6.6 A description counts as already sent only when every health kind it may hold already went to that Provider; the Trace records its kinds on every path
- [x] 6.7 Stop or leaving the conversation cuts an approved `create_workout` waiting on the health question: nothing sent, no workout, Trace stopped (unit and end-to-end, red first)

## 7. Quality gates

- [x] 7.1 `health-data-notice.spec.ts` (English and Spanish, stubbed Provider); the chat specs give a standing answer
- [x] 7.2 `pnpm lint`, `pnpm test:scripts`, `@kaiord/ai` tests, the App unit suite, the AI e2e specs, `pnpm lint:claims`
- [x] 7.3 Changeset
