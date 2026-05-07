---
"@kaiord/workout-spa-editor": minor
---

Coaching activity dialog redesign — editor sidebar (PR 3/4):

- `EditorPage` now detects coaching-derived workouts by reading `SessionMatchRepository.getByWorkoutId(profileId, workoutId)` reactively and renders a right-hand `CoachingSidebar` alongside the step editor when the match source is `auto-conversion`, `auto-coaching-v10-migration`, or `manual` (per design D4).
- The sidebar shows the activity title, sport icon + label, status, and formatted coach description. The formatter preserves `<p>` paragraph breaks and `<strong>` emphasis, strips every other tag, and walks a typed AST → React (no `dangerouslySetInnerHTML`).
- Collapse toggle persists to `localStorage` under `kaiord.editor.coachSidebar.collapsed`; default expanded ≥768px and collapsed <768px on first mount.
- Reactive: the sidebar's live query is keyed on `(profileId, workoutId)`, so bridge re-syncs of the coaching description update the sidebar without a full editor reload.
