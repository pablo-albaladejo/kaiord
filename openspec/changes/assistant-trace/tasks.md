## 1. Proofs, red first

- [x] 1.1 `trace-stays-on-device.test.ts`: not in the sync snapshot, untouched by a snapshot import, not in a backup file, dropped from a tampered file
- [x] 1.2 `trace-run.test.ts`: one Trace with cost, unit, retries and data sent; written once; a batch in one Trace; usage forwarded under its id; Tools; failed; unknown price
- [x] 1.3 `prune-traces.test.ts`: newest 200, none older than 90 days
- [x] 1.4 `export-traces.test.ts`, `kinds-sent.test.ts`, `trace-read-tools.test.ts`
- [x] 1.5 Features: generation, batch, lab extraction and chat turn (send, confirm, refuse, fail) each leave one Trace
- [x] 1.6 Settings: `TracesSection.test.tsx` (empty, read one, export, delete all), the inventory's kept-on-device group
- [x] 1.7 E2E `assistant-trace.spec.ts`: a chat turn against a stubbed Provider, the Trace read and exported, in English and Spanish, never in a request

## 2. Kaiord App

- [x] 2.1 `traces` store, schema v38 (head, schema only), history entry, device-local, backup `exclude`
- [x] 2.2 `startTraceRun`, `buildTrace`, `pruneTraces`, `exportTraces`, `kindsSent`, `traceReadTools`
- [x] 2.3 Chat turn, `generateWorkoutKrd`, batch runner and lab extraction run inside one Trace; the console line goes
- [x] 2.4 Settings, Privacy: the Traces section and the inventory's kept-on-device group, English and Spanish

## 3. Public surfaces

- [x] 3.1 Privacy policy paragraph and check rule with its test
- [x] 3.2 `claims/data-flows.json` entries for the new inventory sentence
- [x] 3.3 GLOSSARY.md and the UX glossary name the Trace in both languages
