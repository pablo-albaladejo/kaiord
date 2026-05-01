> Completed: 2026-05-01

## Why

The SPA editor's Library surface today exists as **two parallel implementations** that have drifted:

1. **Page** at `/library` (`LibraryPage.tsx`) — direct URL, browse/search/filter.
2. **Modal** mounted from the header (`LayoutHeaderDialogs.tsx` → `WorkoutLibrary` Dialog) — same content, but with extra `onLoadWorkout` / `hasCurrentWorkout` affordances the page lacks.

A user clicking "Library" in the header sees the modal (URL stays on `/calendar`). A user clicking "Add from Library" in the empty-day dialog gets navigated to `/library` (the page) and **loses the date context** the picker was supposed to use. Same name, two surfaces, two divergent feature sets.

The split is **accidental drift, not designed coupling**: the page was added later to support deep-linking; the modal predated it; nobody removed the modal entry point.

A 5-Principal-level UX panel (run as part of `/opsx-explore` on 2026-05-01) converged on a single rule:

> **Routes for content destinations. Modals for meta and in-flow pickers.**

The current 5 routes (`calendar`, `library`, `workout/new`, `workout/:id`) are all content-bearing nouns and correctly belong to URLs. The header-only surfaces (Settings, Help, Profile) are meta/preferences and correctly stay as modals. The Library _header modal_ is the only surface that violates the rule. The fix is to delete the modal duplication and replace the picker-from-calendar use case with a small focused `TemplatePickerDialog` that keeps the date context the legacy `navigate('/library')` flow throws away.

This change ratifies that rule as a `spa-routing` capability requirement so future surfaces get classified consistently and the dual-implementation drift doesn't recur.

## What Changes

**Behavioral:**

- The header "Library" button navigates to `/library` (page) instead of opening a modal. URL and history reflect the user's location.
- A new `TemplatePickerDialog(date, onPick)` covers the calendar in-flow picker scenario: small search-only UI, no delete/edit, returns the selected template + date to the caller.
- `EmptyDayDialog.handleLibrary` opens the new picker dialog with the date prop instead of navigating to `/library` (which loses the date).
- `LibraryPage` gains feature parity with the deleted modal: a "Load into editor" CTA when the editor has an active workout (the `hasCurrentWorkout` / `onLoadWorkout` affordances).

**Routing capability rule (NEW):**

- A SPA surface SHALL be a routed page when it is a content destination (browseable, bookmarkable, returnable).
- A SPA surface SHALL be a modal when it is **meta** (settings, help, profile) **or** an **in-flow picker** bound to a parent route's transient context.
- A surface SHALL NOT exist as both a routed page and a header-mounted modal that share the same component tree, because feature drift is otherwise inevitable.

**Code-level:**

- `packages/workout-spa-editor/src/components/templates/MainLayout/components/LayoutHeaderDialogs.tsx` — remove the `WorkoutLibrary` lazy mount + `library` LazyDialog prop.
- `packages/workout-spa-editor/src/components/templates/MainLayout/components/DesktopNav.tsx` (and mobile equivalent `MobileNav.tsx` / `MobileMenu.tsx`) — drop the `onLibraryClick` prop and have `LibraryButton` call wouter directly: `const [, navigate] = useLocation(); navigate('/library')`.
- `packages/workout-spa-editor/src/components/organisms/WorkoutLibrary/` — split into:
  - `LibraryDialogContent` (existing) → keeps powering `LibraryPage`.
  - **New** `TemplatePickerDialog` → search-only, focused, scoped picker exporting `{ open, onOpenChange, date, onPick }`. Lives under `components/molecules/` since it's an in-flow picker.
- `packages/workout-spa-editor/src/components/molecules/EmptyDayDialog/EmptyDayDialog.tsx` — `handleLibrary` opens `TemplatePickerDialog` with the dialog's `date`. The selection schedules the template via the existing `scheduleTemplate` use case.
- `packages/workout-spa-editor/src/components/pages/LibraryPage.tsx` — add the "Load into editor" CTA section, gated on `hasCurrentWorkout` (lifted from the modal's logic).
- `packages/workout-spa-editor/src/components/templates/MainLayout/MainLayout.tsx` — add an `aria-live="polite"` route announcer that reads the new path on each wouter location change (a11y parity with the modal's Radix Dialog announcement).

**Test surface:**

- Existing `routes.test.tsx` — verify `/library` still renders `LibraryPage`. Add a test that the header "Library" button navigates to `/library` (no modal mounting).
- Existing `LibraryPage.test.tsx` — extend with the new "Load into editor" CTA assertion.
- New `TemplatePickerDialog.test.tsx` — open, search, select, returns expected payload, Esc closes, focus restores.
- Existing `EmptyDayDialog.test.tsx` — replace the `navigate('/library')` assertion with picker-dialog open assertion + payload propagation.
- Playwright e2e `library-flows.spec.ts` (new) — exercises both flows: header → page → schedule; calendar empty-day → picker → schedule. Stays in dev-mode.

## Impact

- **Affected specs**: `spa-routing` capability — adds 1 ADDED requirement: "SPA surface classification (routed-page vs modal)" with 4 scenarios (page-classified, modal-meta-classified, modal-picker-classified, no-dual-mount). The existing requirement "SPA router base alignment with Vite deploy base" is unchanged.
- **Affected code**: ~10 files (header components, library page, library organism split, empty-day dialog, main layout for announcer, plus tests).
- **Affected tests**: 4 existing test files extended; 2 new test files (`TemplatePickerDialog.test.tsx`, `library-flows.spec.ts`).
- **Risk-1 — Bookmark / quick-glance behaviour**: Header click changing from "open modal" to "navigate to /library" is a visible UX shift. Pre-fix users clicking "Library" while editing a workout saw a modal preserving the editor underneath; post-fix they navigate away. The cost is heaviest for tablet / split-view users who treat the modal as "consult while keeping the workout visible" — the residual is real and accepted. Mitigations: (a) the new `LibraryPage` gains the "Load into editor" CTA so the workflow is still discoverable, (b) browser back is the documented escape hatch (Back returns to the editor with full history-state), (c) the unsaved-changes prompt prevents accidental loss when navigating away, (d) the changeset surfaces the URL-shape change so external observers understand. A one-time migration toast for the first post-deploy header click is listed under Follow-ups.
- **Risk-2 — Date-context regression**: `EmptyDayDialog` currently navigates to `/library` without passing the date, so the user has to re-pick the date inside the page UI. Post-fix the picker dialog receives the date directly. This is an actual UX **improvement** (the regression existed in the legacy flow); flagged so reviewers know that current behavior at the page is technically wrong by today.
- **Risk-3 — Feature-parity drift between picker and page**: With two implementations gone, the residual drift surface is between `LibraryPage` (full UI) and `TemplatePickerDialog` (subset). Mitigation: the picker's UI is intentionally narrow (search + select); reviewers should resist adding delete/edit there.
- **Risk-4 — A11y route announcement**: Wouter does not auto-announce route changes. Mitigation: explicit `MainLayout` `aria-live` announcer; covered by an existing-or-new `MainLayout.test.tsx` assertion.
- **Out of scope**: Migrating Settings / Help / Profile to pages (panel scored those correctly as modals — meta surfaces). The `Workout edit/new` routes already comply. Search/filter behaviour inside the residual `LibraryPage` is unchanged. The `ScheduleDateDialog` / `useScheduleTemplate` flow is unchanged — this proposal reorganises _who opens what_ without touching domain use cases.
