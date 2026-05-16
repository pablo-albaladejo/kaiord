---
"@kaiord/workout-spa-editor": patch
---

UX redesign Phase 0 tooling: add `feature-flags.ts` scaffold under
`packages/workout-spa-editor/src/lib/` exposing every `ux2026.*` flag
the redesign roadmap will use (spineHeader, unifiedCreate,
dragSchedule, polishWithAi, calendarCompletion, weeklySummary,
commandPalette, zonePeek), all defaulting to `false`, plus
`useFeatureFlag` and `isFeatureFlagEnabled` accessors and a unit
test. Add a `scripts/check-ux-glossary-shape.mjs` mechanical guard
(`R-UXGlossaryShape`) with a co-located `node:test` suite — verifies
that `packages/workout-spa-editor/docs/ux-glossary.md` exists and
keeps its three top-level sections (Verbs, Nouns, State labels) plus
the canonical `**Create**` verb row, so a future CTA-copy guard can
rely on a well-formed input. No behavioural or visual change.
