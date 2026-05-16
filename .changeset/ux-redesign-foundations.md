---
"@kaiord/workout-spa-editor": patch
---

UX redesign foundations (Phase 0+1 structural slice): introduce a UX
glossary (`packages/workout-spa-editor/docs/ux-glossary.md`) defining
canonical verbs and nouns for the spa editor; add a `Card` atom and
migrate three duplicated inline `rounded-lg border …` surfaces
(`ManualCreateSection`, `GettingStartedTips`, `LibraryPageCard`) to it;
add a visible `EditorPageHeader` to replace the previous `sr-only` h1
so the editor matches the header pattern used by `LibraryPageHeader`.
`EmptyWeekState` is migrated from raw HTML buttons (inline
`bg-primary-600 px-4 py-2 …`) to the `Button` atom (`primary` /
`secondary`, `sm`) without copy changes. No behavioural change. See
`.omc/specs/deep-dive-ui-flow-map-ux-redesign.md` for the full phased
roadmap; verb-pass and AI/journey items ship in subsequent PRs.
