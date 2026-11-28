## 1. Garmin

- [x] 1.1 A failing test shows the bridge refusing a workout with a `description`; the gate admits one up to 1024
- [x] 1.2 The Garmin writer cuts a longer workout description to 1024
- [x] 1.3 The Garmin writer cuts a step description to 200 and the gate refuses one over 200
- [ ] 1.4 The live Garmin capture measures both real limits: POST a workout description and a step description of increasing length, GET them back and compare; set both caps to what it finds

## 2. AI

- [x] 2.1 Core helpers for the note origin (`markAiNote`, `isAiNote`, `clearNoteOrigin`, `STEP_NOTE_MAX`), tests first
- [x] 2.2 The parser's wire schema carries `notes` and `noteOrigin`; a parser test fails if the schema strips them; prompt 1.4.0
- [x] 2.3 The step-notes agent and prompt; a hostile answer keeps only notes
- [ ] 2.4 Re-record the committed parser cassettes with `pnpm --filter @kaiord/ai eval:live -- --record`

## 3. Steps-table path

- [x] 3.1 `chooseCoachingBuilder` adds the notes call's notes to the table Workout: cue, then HR range, within 200
- [x] 3.2 A failed call keeps the steps and HR ranges and returns `stepNotesFailed`; the dialog shows the notice
- [x] 3.3 The port picks the provider lazily and makes no call without one

## 4. Editor

- [x] 4.1 The step card and the note field show "AI" on a note the AI wrote on its own; editing removes it

## 5. Disclosures and docs

- [x] 5.1 `coachingStepNotes` data flow, en/es wording, claims register, privacy policy
- [x] 5.2 GLOSSARY.md and the UX glossary: "Step note"
- [x] 5.3 e2e: the table notes, and the Athlete note changing the notes on Regenerate
