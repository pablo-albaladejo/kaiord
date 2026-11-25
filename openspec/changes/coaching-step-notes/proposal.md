## Why

Issue #1688 (parent #1670), owner decisions of 25 Nov 2026. When a Coaching
Activity becomes a Workout, the coach's cue for each stretch (for example
"single-leg pedalling" on three 30 s efforts) is lost, so the watch shows
nothing when the step starts:

- the AI is asked for step notes, but its output schema has no `notes`
  field, so they are dropped before the result is read;
- a Workout read from the coach's steps table gets only the HR range as each
  step's note;
- the Garmin bridge's request gate has no workout-level `description`, so a
  coaching Workout, which always carries the coach's text there, is refused.

## What Changes

- **Garmin bridge.** The gate admits the workout `description` up to 1024
  characters; the Garmin writer cuts a longer coach text to that cap.
- **AI path.** The parser's output carries each step's note and whether the
  coach or the AI wrote it. The prompt (1.4.0) asks for the coach's cue, in
  the coach's language, with the Athlete note applied.
- **Steps-table path.** The steps still come from the table. When an AI is
  configured, a separate notes-only call writes each step's note; it can
  only add notes. Each note reads the cue first, then the HR range, within a
  step's 256 characters, the cue cut, never the HR range. A failed call keeps
  the table Workout with its HR ranges and a notice says so; Regenerate
  tries again.
- **Origin label.** A note the AI wrote on its own carries an "AI" label in
  the editor; editing it removes the label. The device shows only the text.
- **Disclosures.** A `coachingStepNotes` data flow (the coach's plan only),
  the privacy policy, and the claims register describe the notes call.
  GLOSSARY.md gets "Step note".

## Capabilities

### Modified Capabilities

- `spa-coaching-integration`: step notes on a Workout built from a Coaching
  Activity, by the AI or from the steps table; the AI label.
- `garmin-bridge`: the workout body admits a bounded `description`.
- `ai-agents`: the workout parser carries step notes; the step-notes agent.

## Impact

- `packages/garmin-bridge` (request bodies), `packages/garmin` (writer).
- `packages/core` (the note origin helpers), `packages/ai` (parser wire
  schema and prompt 1.4.0, the step-notes agent and prompt).
- `packages/workout-spa-editor`: coaching use cases, the notes call, the
  step card and step editor, i18n (en, es), data flows.
- `packages/docs/legal/privacy-policy.md`, `claims/data-flows.json`,
  `GLOSSARY.md`, the UX glossary.
- The committed parser cassettes are stale until re-recorded (the wire
  schema and prompt changed).
