---
"@kaiord/workout-spa-editor": patch
---

feat(spa-editor): unify Library to a routed page; add narrow TemplatePickerDialog for in-flow picking

The header Library button now navigates to `/library` (a routed page) instead of opening a modal over the current view. Bookmark-friendly and back-button-friendly. Calendar empty-day's "Add from Library" opens a focused template picker that preserves the day's date instead of navigating away.

Internally this ratifies a `spa-routing` capability rule: routed pages for content destinations, modals for meta surfaces and in-flow pickers. The previous header-mounted Library modal is deleted; a new no-dual-mount mechanical guard (`scripts/check-no-library-dual-mount.mjs`) enforces that the Library content component cannot be silently re-summoned as a modal in a future PR. A live route announcer (`aria-live="polite"`, `aria-atomic="true"`) and `useFocusOnRouteChange` restore the focus / SR announcement equity the deleted modal provided via Radix Dialog.
