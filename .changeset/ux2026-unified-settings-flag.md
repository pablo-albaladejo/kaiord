---
"@kaiord/workout-spa-editor": patch
---

Add `ux2026.unifiedSettings` feature flag (default `false`) to the
`FEATURE_FLAGS` const in `packages/workout-spa-editor/src/lib/feature-flags.ts`.
Prerequisite for PR E of the UX redesign roadmap
(`.omc/plans/ralplan-ux-redesign-phase1-leftovers-and-phase2.md`),
which will gate the unified `/settings` route behind this flag. No
behavioural change — the flag is not yet read anywhere. Existing
namespace + default-false tests cover the new entry automatically.
