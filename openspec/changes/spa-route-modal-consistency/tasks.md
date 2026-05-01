<!-- opsx-ship: chunking
PR 0 (proposal): openspec artifacts only
PR 1 (implementation): §1, §2, §3, §4, §5, §6 — single bundled refactor
PR 2 (archive): §7
-->

## 1. Phase 1 — Worktree + scoping

- [ ] 1.0 Worktree setup: `git worktree add -b feature/spa-route-modal-consistency <WORKTREE_DIR>/kaiord-spa-route-consistency-impl main` (replace `<WORKTREE_DIR>` with your local worktree parent directory). Run `pnpm install` and rebuild workspace deps.
- [ ] 1.1 Re-read the panel converged recommendation in `proposal.md` and `design.md` D1–D6 to confirm the boundary for `TemplatePickerDialog`'s narrow UI surface (search only; no delete/edit/load CTAs).

## 2. Phase 1 — Extract TemplatePickerDialog

- [ ] 2.1 Create `packages/workout-spa-editor/src/components/molecules/TemplatePickerDialog/TemplatePickerDialog.tsx`. Props: `{ open: boolean; onOpenChange: (open: boolean) => void; date: string; onPick: (templateId: string) => void; }`. Internal: search input, sport/difficulty filters (read-only display), template card list. Selecting a card invokes `onPick` and closes the dialog. Dialog accessible name MUST include a human-readable form of the `date` prop (e.g. `aria-labelledby` pointing at a title node "Pick a template for Monday, May 4") so SR users hear the date context — the spec scenario requires this.
- [ ] 2.2 Reuse the existing `useWorkoutLibrary` data hook (template list + filter state). Strip out delete/edit affordances — the dialog must NOT expose a delete or edit button, and the card click handler must call `onPick`, not navigate.
- [ ] 2.2a **Bundle/lazy-loading guidance.** Lazy-load the heavy template-list child (`React.lazy` + `Suspense fallback={...}`) so opening the EmptyDayDialog does NOT eagerly pull the picker's full template grid. Verify the EmptyDayDialog gzipped chunk does not grow more than ~5KB after the wire-up; if it does, split the picker's child further.
- [ ] 2.3 Add `packages/workout-spa-editor/src/components/molecules/TemplatePickerDialog/TemplatePickerDialog.test.tsx`:
  - Open with mocked templates → cards render
  - Type in search → filtered list
  - Click a card → `onPick` invoked with the right id, dialog closes (`onOpenChange(false)`)
  - Esc key → dialog closes
  - No delete/edit affordance is rendered (assert by negative `queryByRole('button', { name: /delete|edit/i })` returning null)
  - **Date in accessible name**: render with `date="2026-05-04"`, assert the dialog has an accessible name containing a date string (`getByRole('dialog', { name: /May 4/i })` or equivalent for the locale formatter the picker uses)
  - **Focus restoration on close**: render with a `<button>Add from Library</button>` initially focused as the trigger, open the picker, press Esc, assert the trigger button has focus (covers the EmptyDayDialog → picker → Esc → focus-back path)
- [ ] 2.4 Run `pnpm --filter @kaiord/workout-spa-editor test src/components/molecules/TemplatePickerDialog` — passing.

## 3. Phase 1 — Rewire EmptyDayDialog to use the picker

- [ ] 3.1 Edit `packages/workout-spa-editor/src/components/molecules/EmptyDayDialog/EmptyDayDialog.tsx`: replace `handleLibrary = () => navigate('/library')` with state opening `TemplatePickerDialog` mounted as a sibling. **Critical wiring detail (resolves use-case ambiguity):** the picker's `onPick(templateId)` callback MUST call the **application use case** `scheduleTemplate(persistence, { templateId, date })` directly with the dialog's already-known `date` prop. It MUST NOT route through `useScheduleTemplate()` / `ScheduleDateDialog`, because that hook mounts a date-confirmation dialog and the date is already committed. The `persistence` argument MUST come from the existing persistence context (e.g. `usePersistence()` hook in `contexts/persistence-context.tsx`) — the same source `useScheduleTemplate` already consumes — and MUST NOT be obtained by instantiating Dexie at the call site (that violates the hexagonal injection rule and would trip the `check-no-zustand-writethrough.mjs` mechanical guard). After the use case resolves, close both dialogs and surface a toast/feedback per existing patterns.
- [ ] 3.1a Browser-back behaviour: ensure the picker's `Dialog.Root onOpenChange` does NOT push a `history.pushState` entry. Pressing the browser back button while the picker is open SHALL close the picker and leave the parent route's history entry intact (per spec scenario "Browser back button closes an open in-flow picker without losing the parent route").
- [ ] 3.2 Update `packages/workout-spa-editor/src/components/molecules/EmptyDayDialog/EmptyDayDialog.test.tsx`: replace the assertion `expect(location.history).toContain('/library')` with assertions that:
  - Clicking "Add from Library" opens `TemplatePickerDialog`
  - On `onPick(templateId)`, the application use case `scheduleTemplate` is called with the right template id and the dialog's `date` (mock the persistence port; assert the call shape)
  - No `ScheduleDateDialog` mounts during the flow (negative assertion: `queryByRole('dialog', { name: /pick a date/i })` returns null)
  - Both dialogs close after the use case resolves
- [ ] 3.3 Run `pnpm --filter @kaiord/workout-spa-editor test src/components/molecules/EmptyDayDialog` — passing.

## 4. Phase 1 — Promote LibraryPage to feature parity

- [ ] 4.1 Edit `packages/workout-spa-editor/src/components/pages/LibraryPage.tsx`: add a "Load into editor" CTA in the page header, gated on `hasCurrentWorkout`-style state from the editor store. Reuse the `loadTemplate` use case the deleted modal called via `onLoadWorkout`.
- [ ] 4.2 If the editor has unsaved changes, the CTA SHOULD trigger the existing `useUnsavedChangesPrompt` hook before loading (R1 mitigation in design.md).
- [ ] 4.3 Update `packages/workout-spa-editor/src/components/pages/LibraryPage.test.tsx`: add a test asserting the CTA is visible only when `hasCurrentWorkout` is true and that clicking it invokes `loadTemplate` for the selected card.
- [ ] 4.4 Run the test — passing.

## 5. Phase 1 — Delete the header-mounted Library modal

- [ ] 5.0 **Resolve mobile nav filename ahead of time.** Run `rg -l "LibraryButton|onLibraryClick" packages/workout-spa-editor/src/components/templates/MainLayout` and record the actual mobile nav file (likely `MobileNav.tsx`); update task §5.2 with the resolved path before starting.
- [ ] 5.1 Edit `packages/workout-spa-editor/src/components/templates/MainLayout/components/LayoutHeaderDialogs.tsx`: remove the `WorkoutLibrary` lazy import, the `library: LazyDialog` prop entry, and the `<WorkoutLibrary>` JSX block. Update the prop type if the parent passes a `library` field.
- [ ] 5.2 **Decision on `onLibraryClick` shape.** Delete the `onLibraryClick` prop entirely; have `LibraryButton` call wouter's `useLocation` itself, idiomatically destructured: `const [, navigate] = useLocation(); navigate('/library')` — match the call-site style sibling components in the same directory use. Rationale: a thin proxy prop that only forwards a `navigate()` call is dead weight and confuses future readers; inline destructuring (`useLocation()[1]`) is unidiomatic and reads poorly. Update both desktop and mobile nav to drop the prop. Same change in the mobile nav (path resolved in §5.0).
- [ ] 5.3 Search and update all stale references: `rg "library: <" packages/workout-spa-editor/src/`, `rg "onLibraryClick" packages/workout-spa-editor/src/`, `rg "useLazyDialog\\(['\"]library" packages/workout-spa-editor/src/` (this last grep catches the upstream hook caller that produces the now-deleted `LazyDialog` value). Update or remove every match.
- [ ] 5.4 Update `packages/workout-spa-editor/src/components/templates/MainLayout/LayoutHeader.test.tsx` to assert that clicking "Library" navigates to `/library` (no Dialog mount).
- [ ] 5.5 **Mechanical CI guard for the no-dual-mount invariant.** Create `scripts/check-no-library-dual-mount.mjs`. It runs `rg --files-with-matches "from ['\"][^'\"]*organisms/WorkoutLibrary"` against `packages/workout-spa-editor/src/` and asserts the file list is exactly the allowlist (e.g. `LibraryPage.tsx`, `TemplatePickerDialog.tsx`). Any new importer fails the script with the offending path. Co-located test `scripts/check-no-library-dual-mount.test.mjs` exercises both pass and fail paths against a temp tree. Wire into `pnpm test:scripts` and the lint pipeline.

## 6. Phase 1 — Route announcer + focus management in MainLayout

- [ ] 6.0 **Pre-flight grep**: run `rg "\\.sr-only" packages/workout-spa-editor/src/` to confirm a `.sr-only` utility exists (Tailwind ships it; if absent, add the standard 6-rule clip-path snippet to a global CSS file before §6.1).
- [ ] 6.1 In `packages/workout-spa-editor/src/components/templates/MainLayout/MainLayout.tsx`: add a small `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{currentRouteLabel}</div>` whose text comes from a `useRouteAnnouncerLabel()` hook. **Rationale comments at the JSX node:** (a) `polite` because navigation announcements should not interrupt user-typed input or in-flight feedback (e.g. toast); `assertive` is reserved for errors. (b) `aria-atomic="true"` so the announcer label is read as a single unit — without it, some assistive technology diffs the old and new labels and reads only the changed token, producing partial announcements like "Library" instead of "Library page".
- [ ] 6.2 Implement `packages/workout-spa-editor/src/hooks/useRouteAnnouncerLabel.ts`: subscribes to wouter's `useLocation()[0]`, maps the pathname to a human label and updates on `pathname` change only (ignore query strings). Label values MUST be suffixed with " page" (or equivalent disambiguating text) so they do NOT collide with the page's `<h1>` text — otherwise screen readers may read both ("Library Library") when focus moves to the heading after navigation. Concretely: `/calendar/...` → "Calendar page", `/library` → "Library page", `/workout/new` → "New workout", `/workout/:id` → "Edit workout". On initial mount the hook MUST return a non-empty label so deep-linked first-loads produce a single SR announcement (per spec scenario "Initial mount announces the current route").
- [ ] 6.2a **Localisation note.** Labels are English-only consistent with the rest of the SPA copy today. If the project later adopts an i18n framework, the same map should be wrapped in `t(...)`. Document this in a one-line comment in the hook.
- [ ] 6.3 Add `packages/workout-spa-editor/src/hooks/useRouteAnnouncerLabel.test.tsx`:
  - Each of the 5 known routes (`/`, `/calendar`, `/calendar/:weekId?`, `/library`, `/workout/new`, `/workout/:id`) returns the expected label.
  - Query-string-only changes do not produce a new label.
  - Initial mount with a deep-linked URL produces a label on first render (no empty string).
- [ ] 6.4 **Focus management on route change.** Implement `useFocusOnRouteChange()` (or fold into `MainLayout`): on each pathname change, find the page's `[data-route-heading]` element and call `.focus()` on it. Each routed page (each routed page) renders an `<h1>` (or other heading element) with `tabIndex={-1}` and the route-heading attribute via a shared constant: `export const ROUTE_HEADING_ATTR = 'data-route-heading' as const;` exported from `src/routing/constants.ts`. The CSS for `[data-route-heading]` MUST suppress the focus ring for non-keyboard activations: `[data-route-heading]:focus:not(:focus-visible) { outline: none; }`. The default `:focus-visible` ring stays so Tab navigation users still see the indicator.
  Each routed page that backs a wouter route renders the heading; do not couple this task to a specific component name (resolve the actual page-component names at implementation time via `rg "<Route path=" packages/workout-spa-editor/src/App.tsx`).
  Add tests:
  - `useFocusOnRouteChange.test.tsx` — simulate navigation and assert the new heading element has document focus.
  - For each routed page, a test that the heading element has `tabIndex={-1}` and the `data-route-heading` attribute (use the `ROUTE_HEADING_ATTR` constant in the assertion to catch typos).
  - A negative-path unit test: if `[data-route-heading]` is absent on the new page, the hook MUST log `console.warn` once with the offending pathname and fall back to focusing `document.body` so the contract failure is loud but not fatal.
  - A Playwright assertion in §7.1 Test A that after clicking header "Library", the rendered `<h1>` of the LibraryPage has document focus.
- [ ] 6.5 Run `pnpm --filter @kaiord/workout-spa-editor test src/hooks/useRouteAnnouncerLabel src/hooks/useFocusOnRouteChange` — passing.

## 7. Phase 1 — E2E flows + final validation

- [ ] 7.1 Create `packages/workout-spa-editor/e2e/library-flows.spec.ts`:
  - Test A: header click → URL becomes `/library`, page renders, the LibraryPage `<h1>` has document focus (`expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('H1')` plus a `data-route-heading` attribute check), navigating back with browser back returns to calendar.
  - Test B: calendar empty-day → "Add from Library" → `TemplatePickerDialog` opens with the day's date in its accessible name (e.g. `getByRole('dialog', { name: /May 4/i })` for a 2026-05-04 cell); URL stays on `/calendar/<weekId>`. Selecting a template schedules it; both dialogs close. After close, assert `expect(page.url()).toMatch(/\/calendar\/2026-W\d+$/)` so the parent route's full path (including weekId) is preserved.
  - Test B-back: open the picker as in Test B, press browser back, assert the picker closes and the URL is unchanged from the parent route.
  - Test C: header click while editor has an active workout → page renders with "Load into editor" CTA visible. Click the CTA → assert the editor receives the loaded template (visible in the workout editor view: title, step count, or sport label match the picked template); guard against the CTA being a render-only artefact disconnected from the use case.
  - Test D: mobile viewport — header "Library" tap navigates to `/library` (no modal mounts; check `getByRole('dialog')` returns nothing).
- [ ] 7.2 Run `pnpm --filter @kaiord/workout-spa-editor lint` — clean.
- [ ] 7.3 Run `pnpm --filter @kaiord/workout-spa-editor test` — full vitest, no regressions.
- [ ] 7.4 Run `pnpm test:e2e` (dev-mode) — full Playwright suite, no regressions.
- [ ] 7.5 Run `pnpm -r build` — clean.
- [ ] 7.6 Run `pnpm test:scripts` — clean.
- [ ] 7.7 Run `openspec validate spa-route-modal-consistency --strict` — passing.
- [ ] 7.8 Add a `patch` changeset for `@kaiord/workout-spa-editor` describing the surface-classification rule and the user-visible behaviour change for the header "Library" click. Body MUST include: "The header Library button now navigates to `/library` (a routed page) instead of opening a modal over the current view. Bookmark-friendly and back-button-friendly. Calendar empty-day's 'Add from Library' opens a focused template picker that preserves the day's date instead of navigating away."
- [ ] 7.9 Open the implementation PR; ensure CI green; squash merge.
- [ ] 7.10 Verify in production after deploy: header "Library" navigates to `kaiord.com/editor/library`; calendar empty-day picker opens without changing URL.

## 8. Phase 2 — Archive

- [ ] 8.1 Pull main; run `pnpm lint:specs` — pre-archive expectation: `spa-routing` capability has 1 requirement (the existing base-alignment rule from PR #408).
- [ ] 8.2 Run `openspec validate spa-route-modal-consistency --strict`.
- [ ] 8.3 Run `openspec archive spa-route-modal-consistency --yes` — adds the new requirement to `openspec/specs/spa-routing/spec.md`.
- [ ] 8.4 **Amend `## Purpose` of the `spa-routing` capability** (the archive operation does not modify Purpose paragraphs; this is a hand-edit). Replace the current Purpose with: "Routing and surface-classification rules for the SPA editor: how URLs are derived from Vite's deploy base (so deep-linked routes survive refresh under static hosting), and how each top-level UI region is classified as a routed page, a meta modal, or an in-flow picker dialog so feature-drift between dual surfaces cannot recur." After amending, run `rg 'how each top-level UI region is classified' openspec/specs/spa-routing/spec.md` to verify the new Purpose text landed; the grep must return one match. Note the manual amendment in the archive PR description so the next reviewer understands the diff.
- [ ] 8.5 Verify the archive merged the new requirement next to the existing one (both under `## Requirements`); the H1 (`# SPA Routing`) is unchanged; the Purpose carries the broadened wording from §8.4.
- [ ] 8.5a Confirm `pnpm archive:index` does NOT touch `openspec/specs/spa-routing/spec.md` (the archive index regenerator only updates `openspec/changes/archive/README.md`). Run `git diff openspec/specs/spa-routing/spec.md` after `pnpm archive:index` and assert the diff is empty. If a future `openspec` CLI release regenerates capability Purposes from change proposals, this hand-edit becomes load-bearing — note that risk in the archive PR description.
- [ ] 8.6 Run `pnpm archive:index`, `pnpm lint:archive`, `pnpm lint:archive-index` — all clean.
- [ ] 8.7 Run `openspec validate --specs --strict` and `pnpm lint:specs` — post-archive expectation: 29 specs (unchanged count; existing capability gained a requirement and an updated Purpose).
- [ ] 8.8 Open archive PR; ensure CI green; squash merge.
