## 1. Athlete note

- [x] 1.1 `athleteNotes` store (Dexie v41), port, Dexie and in-memory repositories; migration test; snapshot, backup, cascade, re-key and tombstone coverage
- [x] 1.2 `setAthleteNote` (add, edit, clear as empty text), tests first
- [x] 1.3 "Your note" field in the coaching dialog (en, es); GLOSSARY.md and UX glossary

## 2. Regenerate

- [x] 2.1 `chooseCoachingBuilder`: the note after the coach's text; a steps table without a note needs no AI (`readStepsTable` seam), tests first
- [x] 2.2 `regenerate: true` replaces the Workout in place; on the watch back to Ready; failure writes nothing
- [x] 2.3 `[Regenerate]` with its confirmation (hand edits, on the watch)

## 3. Delete workout

- [x] 3.1 `deleteWorkoutAndMatch` / `restoreWorkoutAndMatch`, tests first
- [x] 3.2 `[Delete workout]` in the dialog with the Garmin notice; the detail page removes the Match too
- [x] 3.3 A leftover Match of a deleted Workout no longer blocks the next build

## 4. Split stays split

- [x] 4.1 `splitCoachingWorkout` detaches the Workout built from the Activity, tests first
- [x] 4.2 Both Split buttons wired

## 5. Disclosures and gates

- [x] 5.1 Data-flows kinds for generation, claims register, privacy policy
- [x] 5.2 e2e: generate → note → regenerate → delete → undo → split
- [x] 5.3 `pnpm lint`, `pnpm test:scripts`, App unit suite, `tsc`, `pnpm size:spa`, coaching Playwright specs, `openspec validate --strict`
