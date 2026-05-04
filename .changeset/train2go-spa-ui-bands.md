---
"@kaiord/workout-spa-editor": patch
---

Add band-level dialog test coverage and label-map count invariants for the train2go-zones-sync-full-bands change. PR 3 of 4.

- 3 new ZonesConflictDialog test cases (5.2a/b/c per `tasks.md`): band-level row rendering with auto-generated label, mixed scalar+band conflicts preserving insertion order, accept-all-rows-of-a-table emits per-row decisions.
- 1 new field-labels test file (5.1a) asserting (a) total label count is exactly 67 (7 threshold scalars + 60 band-level entries from the cross-product helper), (b) no T2G-controlled substring (coach, email, birthday, gender, fat, smoker, imc, user_notes) leaks into any label, (c) every entry has a non-empty value.

The label map and dialog rendering for band-level keys was shipped functional in PR 2 (`@kaiord/workout-spa-editor` minor); this PR locks the contract via tests so a future regression that drops a band's label, leaks a forbidden substring, or breaks the per-row decision emit fails loudly.
