---
"@kaiord/workout-spa-editor": minor
---

Domain foundation for the coaching activity dialog redesign (PR 1/4):

- Adds `convertCoachingActivityWithAi` and `convertCoachingActivityManual` use cases that persist a structured workout and its `SessionMatch` atomically. AI failures (network, abort, invalid KRD, timeout) write nothing.
- Adds the warmup KRD template builder used by the manual-conversion path so the editor renders a non-empty starting point.
- Extends `convertAndAutoMatch` to auto-heal a missing `SessionMatch` on every legacy convert call (matches the v10 retro-fix invariant per-call).
- Ships the Dexie v9 → v10 retro-match migration: scans `coachingActivities` × `workouts` once on next app boot, writes the missing `sessionMatches` rows with `source="auto-coaching-v10-migration"`, and surfaces the count via an info toast plus the `coaching.dexie_v10.migrated` analytics event.
- Wires `coaching.convert_with_ai.invoked / success / failure / cancelled` and `coaching.convert_manual.invoked / success` analytics events.

UI changes (3-state dialog, EditorPage sidebar, E2E flows) follow in subsequent PRs.
