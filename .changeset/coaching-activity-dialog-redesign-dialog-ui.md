---
"@kaiord/workout-spa-editor": minor
---

Coaching activity dialog redesign — dialog UI (PR 2/4):

- Replaces the 2-state (solo/matched) dialog with a 3-state dispatch (`no-workout`, `converted`, `matched`) computed reactively from `workouts` + `sessionMatches` so the UX never depends on which write path created the workout.
- No-workout layout: `[AI process]`, `[Edit manually]`, `[Match existing]`, `[Close]`. The AI hint surfaces above the buttons when the activity description is empty so users know the prompt falls back to title + sport.
- Synchronous AI flow: clicking `[AI process]` swaps the dialog body for an in-flight spinner with a `[Cancel]` button. On success the dialog closes and navigates to the editor; on failure (no provider, transport, invalid KRD, timeout, AI error) it renders an inline error state with `[Retry AI]`, `[Edit manually]`, `[Match existing]`, `[Close]`. AbortController is plumbed through to the use case.
- Matched-state actions are workout-state-conditional: `raw → [Process with AI] [Open editor]`, `structured → [Open editor] [Push to Garmin disabled]`, `ready → [Open editor] [Push to Garmin enabled]`, `pushed → [Open editor]`. Split is always available alongside.
- Auto-heal on dialog open: legacy "converted-without-match" rows (pre-Dexie-v10 data, or any concurrent winner) get their `SessionMatch` created silently using `ensureSessionMatch` with `source="auto-coaching-v10-migration"` (D8 belt-and-braces).
- Emits `coaching.dialog.state_observed` exactly once per dialog open so analytics reflect what the user actually saw, not how many times React re-rendered.
