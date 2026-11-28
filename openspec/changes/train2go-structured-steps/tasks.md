## 1. Read the steps table

- [x] 1.1 `parse-activity-steps.ts` with `steps-grid-*` / `steps-cell-values.ts`: rows, repeat blocks, fail closed, tests first on a synthetic fixture
- [x] 1.2 Daily parser, record and view-model converters carry `structuredSteps`

## 2. Build without the AI

- [x] 2.1 `structured-steps-krd.ts`: power target, heart rate in the note, repetitions, out of range builds nothing
- [x] 2.2 `readStepsTable` and `chooseCoachingBuilder`: the table without a note, the AI otherwise; the table text whenever the table parses
- [x] 2.3 Create, raw re-process and Regenerate through the builder, the sport resolved once
- [x] 2.4 The dialog's `GenerateKrdPort` looks the provider up only when the AI is asked; no AI progress for a table build

## 3. Show the table

- [x] 3.1 `CoachingStepsTable.tsx` under the coach's text (en, es), nothing for a missing table

## 4. Gates

- [x] 4.1 e2e `coaching-dialog-train2go-steps.spec.ts`: the table shown, no LLM call, the stored steps and repeat; build and Regenerate with no provider
- [x] 4.2 `pnpm lint`, App unit suite, `tsc`, `pnpm size:spa`, coaching Playwright specs, `openspec validate --strict`
