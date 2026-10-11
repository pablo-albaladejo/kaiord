> Tasks: 7 completed, 0 deferred

# Tasks

## 1. Empty library (F-05)

- [x] 1.1 `LibraryEmpty` offers "New workout" (→ `/workout/new`) and "Import
      file" (→ `/workout/new?action=import`); a filtered empty result offers
      neither.

## 2. Phone layout (F-45)

- [x] 2.1 Without an AI provider, "Start from" comes before the AI setup
      prompt in the New session sheet.
- [x] 2.2 Bottom-nav geometry tokens in `index.css`; `BottomNav`, its FAB and
      `<main>`'s end padding read them.
- [x] 2.3 The default-profile notice wraps its links under the sentence on a
      phone; the sheet drops its duplicate gutter below `sm`.

## 3. Verification

- [x] 3.1 Unit: `LibraryEmpty` CTAs and filtered state; `CreateInputPhase`
      order with and without a provider.
- [x] 3.2 E2E `empty-states-mobile.spec.ts` (chromium on every PR, 390×664
      `es-ES`): empty-library CTAs, non-AI tiles above the nav without
      scrolling, a long page's end clears the nav.
- [x] 3.3 `verify:prod --only empty-states-mobile` asserts both CTAs and
      their routes, and the three tiles above the nav with the notice shown.
