## Context

Following PR #404's wouter base alignment fix, the user reported (2026-05-01) that "Library" surfaces inconsistently — sometimes as a modal overlay (URL stays on `/calendar`), sometimes as a full page (`/editor/library`). Investigation found the dual-implementation drift documented in `proposal.md`.

The expert panel ran in `/opsx-explore` mode (5 Principal/Staff reviewers: UX architect, frontend engineer, IA/routing, accessibility, product/DX) and converged on a single rule. This design captures the implementation specifics and the boundary calls the rule forces.

```text
Current state                       Target state
─────────────                       ────────────

Header "Library" ──┬─→ MODAL        Header "Library" ──→ navigate('/library')
                   │  (Radix Dialog,
                   │   no URL)

URL /editor/library ─→ PAGE         URL /editor/library ─→ PAGE

EmptyDayDialog ──→ navigate('/library')   EmptyDayDialog ──→ TemplatePickerDialog(date)
   (loses date context)                       (date prop, narrow UI)

WorkoutLibrary organism             Split into:
  Used as: modal AND page body        - LibraryDialogContent → page body
                                      - TemplatePickerDialog → narrow picker

Settings / Help / Profile           Settings / Help / Profile (unchanged)
   Modals (meta) ✓                    Modals (meta) ✓
```

## Goals / Non-Goals

**Goals**

- Apply the **routes-for-content / modals-for-meta-or-pickers** rule to the SPA editor's surfaces.
- Eliminate the dual-implementation drift between the Library modal and the Library page.
- Preserve the in-flow date-context picker scenario (calendar → "schedule a template here") via a focused dialog instead of a full library page.
- Encode the rule as a `spa-routing` capability requirement so future surfaces get classified consistently.

**Non-Goals**

- Migrating Settings, Help, or Profile to pages — they are correctly modals (meta).
- Generalising to a "design system" surface-classification framework — narrow rule for the SPA editor only.
- Changing the underlying Library data model, persistence, or filtering behaviour.
- Changing wouter, the router base alignment from PR #404, or the rafgraph SPA fallback.
- Backwards-compatibility for the legacy `/library` redirect from `EmptyDayDialog` — that flow loses the date context (a regression today); the new picker flow improves it.

## Decisions

### D1. Page is the Library's canonical surface; modal is deleted.

The header button navigates to `/library`. The page gains feature parity (Load-into-editor CTA when `hasCurrentWorkout`). The user mental model becomes: "Library is a destination, not a tool I summon mid-edit."

**Why page over modal?** Bookmarkability, deep-linking from the Garmin extension and MCP server, browser-history integration, external shareability. Modals are unaddressable. The cost of "modal-only" is permanent loss of these properties; the cost of "page + scoped picker" is a one-time component split (already half-done by the existing code organisation).

### D2. Picker scenario gets its own narrow modal: `TemplatePickerDialog`.

The calendar empty-day flow is conceptually different from "browse my templates":

- **Job 1 — Browse my templates.** Deliberate, infrequent, deserves a URL. Page.
- **Job 2 — Pick a template for this Tuesday.** Transient, parent-route-bound (date), picker context. Modal.

These were conflated in one component. The picker takes a `date` prop (the parent's transient state) and an `onPick(template) => void` callback. It does NOT delete or edit (those are destination affordances). It lives under `components/molecules/` to signal its in-flow scope.

The `EmptyDayDialog`'s legacy `navigate('/library')` is replaced by opening this picker. This is **not a backwards-compat shim** — the legacy flow lost the date context (it navigated away, and the page didn't read any query param), so users had to re-pick the date in the page's own scheduling dialog. The picker fixes that bug as a side effect.

### D3. Settings, Help, Profile stay as modals.

The panel's IA review identified the latent rule already implicit in the routing table:

| Surface      | Today                       | Justification                     |
| ------------ | --------------------------- | --------------------------------- |
| Calendar     | Page (`/calendar/:weekId?`) | Content destination               |
| Library      | Mixed (drift)               | → **Page** (content destination)  |
| Workout new  | Page (`/workout/new`)       | Content destination (deep editor) |
| Workout edit | Page (`/workout/:id`)       | Content destination               |
| Settings     | Modal                       | Meta — preferences                |
| Help         | Modal                       | Meta — auxiliary                  |
| Profile      | Modal                       | Meta — user-scoped quick-pick     |

Workout new/edit are pages because they have meaningful internal state, deep-link semantics, and the user returns to them directly. Settings/Help/Profile are modals because they are meta — they don't represent content, they configure the parent.

This change ratifies the rule but does NOT migrate Settings/Help/Profile.

### D4. A route announcer satisfies the a11y residual.

When the header click changes from "open modal (Radix announces via `role=dialog`)" to "navigate (wouter doesn't announce)", screen-reader users lose the announcement signal. Mitigation: a single `<div role="status" aria-live="polite">` in `MainLayout` whose text updates on each wouter location change (e.g., "Calendar", "Library", "New workout"). This restores SR equity with the deleted modal.

The picker dialog itself is a Radix Dialog so it keeps the `role=dialog` + focus trap + Esc semantics for free.

### D5. Spec capability home: extend the existing `spa-routing` capability.

PR #404 / #408 created the `spa-routing` capability with one requirement (router base alignment). This change adds a **second** requirement to the same capability: "SPA surface classification (routed-page vs modal)". Both requirements share the routing problem space; bundling them under one capability avoids capability proliferation. The existing requirement is preserved verbatim.

### D6. No persistence migration; no data model change.

The Library's underlying data store (Dexie templates table) is unchanged. The `useWorkoutLibrary` hook is unchanged. Only the _mounting_ of the UI surface changes, plus a new dialog-shaped subcomponent reusing the same use cases (`scheduleTemplate`, `loadTemplate`).

## Risks / Trade-offs

- **R1 — User behaviour change for header click.** Pre-fix: open modal preserving editor state. Post-fix: navigate to library, editor view unmounted. Mitigation: the new "Load into editor" CTA on the page ensures the workflow remains discoverable; the unsaved-edit warning (existing) prevents accidental loss. Documented in changeset.
- **R2 — Picker scope creep.** Reviewers may push to add filters/delete/edit to `TemplatePickerDialog` over time, recreating the dual-implementation. Mitigation: the new spec requirement explicitly says "search-only, no destination affordances" so the rule is enforceable in PR review.
- **R3 — Route announcer false positives.** Some path changes (query-string only) shouldn't re-announce. Mitigation: announce on `pathname` changes, not full URL changes; covered by a unit test on the announcer's hook.
- **R4 — Mobile menu parity.** The mobile nav also has a "Library" button that calls `onLibraryClick`. Same rewire applies. Verified by the new e2e (`library-flows.spec.ts`) running in mobile viewport.

## Migration Plan

Pure additive at the capability level (one new requirement). Pure refactor at the code level — no data migration, no schema change, no config rename.

Forward-compatible: `/library` URL is preserved; users with bookmarks at the route continue to land on the page (which is the post-fix surface they want).

## Follow-ups

- **One-time migration affordance.** First post-deploy "Library" header click is a behaviour change for existing users. Consider a dismissible banner or toast on the new `LibraryPage` first render: "Library is now a page — your editor is preserved in browser history; press Back to return." Stored under a `localStorage` key so it shows once. Out of scope of this change because it adds UX surface area unrelated to the rule itself; flagged so a follow-up PR can land it.
- **`Workout new` date prop.** The `Workout new` page accepts no `date` query parameter today; if a future feature wants "create workout for date X" from the calendar empty-day flow, the same picker pattern (date prop on a narrow modal) would apply. Out of scope here, called out so the picker pattern is reusable.
- **Unsaved-changes guard.** The "Load into editor" CTA on `LibraryPage` triggers `useUnsavedChangesPrompt` per task §4.2. This is treated as polish, not a hard requirement, because the underlying use case `loadTemplate` already inherits the editor's existing dirty-state guard at the store layer. If reviewers feel it should be a SHALL, lift the prompt assertion into the spec scenario for the page route at a future revision.
- **Future surface classification.** When new SPA surfaces are added (e.g. a hypothetical "Goals" or "Coaching plans" view), the spec's surface-classification requirement applies but its scenario list is library-specific. A future revision may want to lift the no-dual-mount mechanical guard into a generic per-surface allowlist so adding a new content component automatically requires declaring its allowlist.
