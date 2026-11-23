## 1. Code computes (tests first)

- [x] 1.1 `resolve-coach-literals` with durations, paces, splits, speeds, references, % max HR and fills; exhaustive property checks over clocks, minutes and fills
- [x] 1.2 `assertNoComputedSpeeds` in the parser's validate; pipeline: refuse m/s → literals → zones → strict schema
- [x] 1.3 Wire schema carries the literal fields; prompt 1.4.0 teaches them; snapshot refreshed

## 2. Evals

- [x] 2.1 `numbers` dimension and its fixture invariants
- [x] 2.2 Ten pace benchmarks, five English and five Spanish
- [x] 2.3 Keyless end-to-end over each with a rule-following model output; a model-rounded pace and an overfilled block fail
- [ ] 2.4 Live record of the 35 cassettes (`EVAL_MODEL=claude-sonnet-5 pnpm --filter @kaiord/ai eval:live -- --record`), by the maintainer only, before merge

## 3. Chat Tools

- [x] 3.1 `push_to_garmin` waits for the confirmation card; auto-approve removed
- [x] 3.2 Every Tool description tied to `requiresConfirmation` by a test; every action Tool parks at the card
- [x] 3.3 `create_workout` tells the model to pass numbers exactly as written

## 4. Release

- [x] 4.1 Changesets for `@kaiord/ai` and `@kaiord/workout-spa-editor`
- [x] 4.2 `openspec validate --strict`, lint, scripts, package suites, App e2e for generate and chat, `lint:claims`
