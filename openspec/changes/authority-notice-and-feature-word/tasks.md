## 1. Proofs, red first

- [x] 1.1 `authority-change.test.ts`: a new Platform taking a kind is named with the one it replaces; nothing for a kind's first Platform, a Platform already told, one back after a disconnect, one chosen in the matrix, Activities; one notice per Platform pair; nothing forgotten
- [x] 1.2 `AuthorityChangeNotice.test.tsx`: the notice in English and Spanish with the Connections link, the matrix link while it is on, nothing when another device told the athlete, when nothing decided before, when the athlete chose it
- [x] 1.3 `DataTypeRoutingSection.test.tsx`: `?kind=` focuses the row
- [x] 1.4 E2E `authority-notice.spec.ts`: once, no dialog, the link lands on the row, a reload says nothing; never for a matrix choice; English and Spanish
- [x] 1.5 `automatic-authority.test.ts`: one Platform for every health kind; Activities, planned sessions and Workouts kept from every source
- [x] 1.6 `check-retired-terms.test.mjs`: Capability and Capacidad fail; Features, Funciones and the reasoned exceptions pass

## 2. Kaiord App

- [x] 2.1 `authority-change.ts`, `use-authority-inputs-live.ts`, `use-authority-change-notices.ts`, `AuthorityChangeNotice.tsx` in `App.tsx`, `use-focus-routing-row.ts`
- [x] 2.2 `userPreferences.authorityDeciders` and the preferences patch
- [x] 2.3 `connections.authorityNotice` (English and Spanish)
- [x] 2.4 Settings section "Features" / "Funciones"; `capabilities-templates.spec.ts` follows

## 3. Public texts and guards

- [x] 3.1 Landing sentences (English and Spanish), `claims/landing.json` proofs
- [x] 3.2 `ATHLETE_TERMS` and `ATHLETE_ALLOWED`; GLOSSARY.md "Capability"; the UX glossary; AGENTS.md and CLAUDE.md guard lines
