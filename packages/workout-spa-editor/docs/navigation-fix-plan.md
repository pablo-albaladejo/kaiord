# Workout SPA Editor — Navigation Fix Plan

Groups the confirmed findings from [`navigation-consistency-audit.md`](./navigation-consistency-audit.md)
into **work packages** (one coherent unit of work ≈ one file cluster ≈ one PR),
each rated on two independent axes:

- **Severity** = user impact of the bug (High / Med / Low).
- **Fix-risk** = regression risk of _making the change_ (Low / Med / High) — driven by
  blast radius, shared infrastructure, and whether tests pin the current behavior.

> A High-severity bug can have a Low-risk fix (e.g. wrong-date save → thread one param),
> and a Low-severity bug can have a High-risk fix (e.g. back-nav uses shared infra).
> Sequence by **fix-risk ascending** within equal value: bank the safe wins, defer the
> shared-infra rewrites until they have tests around them.

Finding numbers (`#N`) refer to the audit's ranked issue table. Diagnostic only — nothing
here has been applied.

> **Guiding principle (resolved with Claude Design — see [§Resolved design decisions](#-resolved-design-decisions-claude-design)):**
> **Destinations are universal; chrome and context adapt.** Every place in Kaiord is the
> same place on every breakpoint and from every entry point — only the _presentation_
> (header row vs bottom bar + FAB) and the _inherited context_ (the date you came from, the
> surface you're inside) change. Every nav control must **(a)** land on a stable, named
> surface, **(b)** honor its entry-point context, and **(c)** match its destination's
> specificity to its label's specificity. The six formerly-blocked decisions are all
> applications of this one rule.

---

## Recommended sequencing (by ascending fix-risk)

| Phase                          | Work packages              | Why this order                                                                                                                                                                                                                                                                                                 |
| ------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 — Safe wins**              | WP-1, WP-8, WP-10          | Display-only / additive. No nav-behavior change, no test rewrites. Ship immediately.                                                                                                                                                                                                                           |
| **2 — Data correctness**       | WP-5                       | Highest user value (silent wrong-date saves). Self-contained to the create/editor date flow.                                                                                                                                                                                                                   |
| **3 — Dead indirection**       | WP-3                       | Fixes the Athlete "Create profile" loop. Concrete target already exists (`ProfileEditDialog`).                                                                                                                                                                                                                 |
| **4 — Targets & active-state** | WP-2, WP-4                 | Label/target corrections. **Require test updates** (header + bottom-nav tests pin current behavior).                                                                                                                                                                                                           |
| **5 — Medium**                 | WP-6, WP-7, WP-9           | Param plumbing + label coherence (decisions now resolved).                                                                                                                                                                                                                                                     |
| **6 — Shared infra (last)**    | WP-11                      | Back-navigation needs an origin/history source — broadest blast radius; do it with tests in place.                                                                                                                                                                                                             |
| ~~**Blocked**~~ → **Decided**  | (6 product decisions + D7) | ✅ All resolved by Claude Design — see [§Resolved design decisions](#-resolved-design-decisions-claude-design); tasks folded into the WPs above. The last item (Trends tab vs link) is now **settled** — D7 = **link/card** (a tab is spec-prohibited); the measured rule survives only as a future trip-wire. |

---

## Work packages

> **🔎 Implementation readiness ([full report](./navigation-implementation-readiness.md)):** a per-WP
> dry-run against the real code (23-agent audit) found **8 of 11 WPs build-ready** (5 now, 3 after a
> one-line micro-decision) and 3 that needed a design step — **WP-5 (#3), WP-9, WP-11 — now designed**
> ([blocker designs](./navigation-blocker-designs.md)), so **all 11 are build-ready**. It also
> **corrected three of this plan's own fix hints** (flagged inline below with ⚠ **Readiness**).
> **Cleanest first PR: WP-7 + WP-10 + WP-8** (relabels + dead-code + additive discoverability — zero
> behavior-conflict tests).

### WP-1 · Route announcer & route headings (accessibility, display-only)

**Severity:** Med–Low · **Fix-risk:** 🟢 Low · **Findings:** #9, #23, #10, #11, #31, #36

| File                                                   | Change                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/use-route-announcer-label.ts`                   | #9: add `/athlete` → "Athlete page" before the calendar fall-through. #23: add `/workout/view/...` → "Workout page" before the generic `/workout/` branch (currently announces "Edit workout" for the read-only view).                        |
| `components/pages/AthletePage/AthletePageBody.ts(x)`   | #10: make the `<h1>` focusable (`tabIndex={-1}` + `ROUTE_HEADING_ATTR`). #31: use the canonical empty-string attribute, drop the bespoke `data-route-heading="true"` boolean.                                                                 |
| `components/pages/CreateWorkout/CreateSheetHeader.tsx` | #11: add `tabIndex={-1}` + `ROUTE_HEADING_ATTR` to the `<h1>` so `/workout/new` (default surface) has a focus target. **Heading copy (Design #5): "New session".**                                                                            |
| `AthletePage.tsx` + empty/loading states               | #36 **(decided, Design #5):** render the route `<h1>` **eagerly from first paint** (it's part of the route shell, not the data payload); swap only the body between skeleton/empty/loaded. Stable copy: Athlete → "Athlete", Today → "Today". |

**Tests:** extend the announcer test table (`use-route-announcer-label.test.tsx`) with `/athlete` and `/workout/view/:id` rows; add a route-heading presence assertion for CreateWorkout + Athlete empty state.
**Risk note:** zero navigation-behavior change — pure SR/focus correctness. **The `<h1>` text is stable across data states; status goes in the body / `aria-live`, never in the route name.**

---

### WP-2 · Active-tab highlighting & `aria-current`

**Severity:** Med–Low · **Fix-risk:** 🟢🟡 Low–Med · **Findings:** #8, #29, #12, #30

| File                                                       | Change                                                                                                                                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/molecules/StatusHeader/StatusEntryButtons.tsx` | #8/#29: derive active state from `useLocation()` (mirror `isTabActive`) and set `aria-current` + active variant on the desktop header buttons (currently _none_ highlight). |
| `components/molecules/BottomNav/bottom-nav-tabs.ts`        | #12: broaden the calendar branch of `isTabActive` to also match `location.startsWith("/calendar/")` so the week grid highlights the Today tab (mirrors the Settings rule).  |
| `components/molecules/BottomNav/BottomNav.test.tsx`        | #30: update the test that pins Settings-active on the redirect-source `/settings/profile`; add `/calendar/:weekId` active-tab coverage.                                     |

**Risk note:** `isTabActive` is a shared predicate — the #12 broadening is additive but re-run BottomNav tests. Header active-state is purely additive.

---

### WP-3 · Dead `/settings/profile` indirection → real profile entry

**Severity:** **High** (#2) · **Fix-risk:** 🟡 Med · **Findings:** #2, #16, #21, #6
**Root cause:** `/settings/profile` is an _unconditional_ `Redirect → /athlete` (`AppRoutes.tsx`).
Profile management is now `ProfileEditDialog` → `ProfileManagerDialog` rendered **on** `/athlete`
(see `AthleteIdentity.tsx`), not a route. Every `navigate("/settings/profile")` is dead indirection,
and `AthleteEmptyState`'s comment ("redirects… once a profile exists") is stale.

| File                                                                                | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/pages/AthletePage/AthleteEmptyState.tsx` + `AthletePage.tsx`            | #2: open a profile-creation surface **in place** instead of `navigate("/settings/profile")` (which loops `/athlete → /settings/profile → /athlete`). ⚠ **Readiness:** `ProfileEditDialog` has **no create mode** (it's edit-only) — mount **`ProfileManagerDialog` with `editingProfile=null`** (the exact surface Settings uses; `createProfile` auto-activates the first profile, so `AthletePage` swaps to the body automatically). Lift dialog state into `AthletePage`. |
| `components/molecules/StatusHeader/ProfileEntryButton.tsx`                          | #21: `navigate("/athlete")` directly (drop the double-hop). #16: relabel aria to "Open athlete profile" (it lands on the overview, not a manager) — or auto-open the dialog.                                                                                                                                                                                                                                                                                                 |
| `components/molecules/StatusHeader/status-entry-defs.ts` / `StatusEntryButtons.tsx` | #6 **(decided, Design #3a):** add a labeled **"Athlete"** entry to `ENTRY_DEFS` + `primaryNav` and **remove the profile-button redirect hop** — Athlete is a primary destination on **both** breakpoints, with the same label/icon as the mobile tab.                                                                                                                                                                                                                        |

**Keep:** the `/settings/profile` → `/athlete` redirect route (backward-compat for external links).
**Tests:** `AthletePage.test.tsx` — empty-state CTA opens the dialog (not a navigation).

---

### WP-4 · Header entry targets & icons (label ↔ destination)

**Severity:** Med–Low · **Fix-risk:** 🟡 Med (test-coupled) · **Findings:** #7, #33, #27, #35 _(+ Design #2/#3b unification)_

| File                                                         | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/molecules/StatusHeader/status-entry-defs.ts`     | **#7 (baseline):** point the generic "Settings" entry at `/settings` (matching the mobile tab + the generic label); reserve `/settings/ai` for the explicitly AI-contextual call sites. #33: align the header Library icon (book) with the bottom-nav icon (grid) — pick one.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `status-entry-defs.ts` `resolveEntryHref` + Today week-strip | **#35 (decided, Design #2+#3b):** unify the primary calendar entry to **"Today" → `/calendar`** on desktop too, and **demote the week grid to a secondary affordance** reached by tapping the Today **week strip** (→ `/calendar/:weekId`, see WP-8). Removes the `resolveEntryHref` special-case. ⚠ **Readiness:** the week strip currently renders **non-interactive `<div>`s** (`WeekStripColumn.tsx`) — making it clickable is **unscoped in both WP-4 and WP-8**; add it to WP-8 and **sequence the `resolveEntryHref` removal AFTER** it (deleting earlier orphans the desktop week grid). Also delete the then-unused `getCurrentWeekId` import to keep zero-warnings. |
| `components/organisms/AthleteConnections/AvailableRow.tsx`   | #27: "Connect ⟨brand⟩" → generic `/settings/extensions`; pass brand context (anchor/param) or accept generic and relabel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**⚠ Test coupling:** `MainLayout/LayoutHeader.test.tsx:150` (`"should navigate to /settings/ai when the settings button is clicked"`) **pins the bug** — update to `/settings` as part of #7.

---

### WP-5 · Date-param data correctness (the real bugs)

**Severity:** **High** · **Fix-risk:** 🟡 Med (#1/#5 ready) → ✅ **#3 designed** ([blocker designs](./navigation-blocker-designs.md)) · **Findings:** #1, #5, #3, #37
The single highest-value cluster: a calendar-day "+" silently saves the workout on **today**.
⚠ **Readiness split:** **#1 and #5 are build-ready.** **#3 is now designed** ([blocker designs](./navigation-blocker-designs.md))
— there was no scratch→Dexie persist path; the design adds one. **#37** just needs a new `isValidCalendarDate` round-trip helper (none today).

| File                                                                                                            | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/pages/CreateWorkout/build-workout-record.ts` (`:35`) + `use-create-workout.ts`                      | #1: read `?date=` via `useSearch` and thread it into the record (fallback `todayDate()`); today it hardcodes `date: todayDate()`, so `/workout/new?date=…` (AI branch) saves on today.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `new-workout-route.tsx` (`:16`)                                                                                 | #5: pass a context-aware `onClose` that preserves the date instead of a constant `navigate("/calendar")`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `EditorPage.tsx` (`:70`) + `DateBanner.tsx` + `ScratchEditorSurface.tsx` + **new** `persist-scratch-workout.ts` | #3 **(decided + designed, Design #1 — see [blocker designs](./navigation-blocker-designs.md)):** scratch's only save today is a **file export** (`save-handler.ts`, never `workouts.put`) — there is **no scratch→Dexie persist path**. Author a new `persist-scratch-workout.ts` (mirror `persist-imported-workout.ts`: date + profileId + sport → `WorkoutRecord` → `workouts.put` → navigate `/workout/:id`), fired on an explicit save (mount stays side-effect-free, per `ScratchEditorSurface.test.tsx:159`). **Drop "Save as draft (unscheduled)"** — `date` is `z.iso.date()` non-nullable **and** a primary Dexie index (`[profileId+date]`, `[date+state]`), so an unscheduled record needs a schema+index+migration and still wouldn't show on the date-indexed calendar. |
| `components/organisms/ImportDropzoneOverlay/use-import-on-load.ts` (`:27`,`:57`) + schedule boundary            | #37 **(decided, Design #6):** reject calendar-impossible dates (`2026-13-45`, Feb-31) at the **persist boundary** with a true round-trip parse (parse → re-serialize → compare) and a clear error; keep the shape regex as a cheap first-pass gate, but not as the only check.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Tests:** add per-branch date assertions (AI create, scratch, import) — confirm `/workout/new?date=X` persists on X; add a round-trip-rejection test for an impossible date.
**Consistency rule (Design #1):** any create flow entered from a dated surface **schedules onto that date by default**, regardless of sub-path (AI / scratch / import). The entry point determines scheduling, not the authoring method.

---

### WP-6 · `?comments=` deep-link contract

**Severity:** Med · **Fix-risk:** 🟡 Med · **Finding:** #18

| File                                                                 | Change                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/pages/use-dialog-handlers.ts` (`:30`) + `EditorPage.tsx` | The Process action builds `/workout/:id?comments=…` but no destination reads it (repo-wide grep: only the writer). ⚠ **Readiness (default = drop):** consuming is foreclosed — there's no raw→AI-with-selection destination to receive it — so **drop the `?comments=` param** and navigate to `/workout/:id`. The "pass via store" half is unnecessary (nothing consumes a selection). |

---

### WP-7 · "Go to Calendar" coherence & wouter idiom

**Severity:** Med · **Fix-risk:** 🟢🟡 Low–Med · **Findings:** #15, #13, #14, #32

| File                                                          | Change                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/pages/EditorLoadingState.tsx` (`:21`)             | **#15:** replace the raw `<a href="/calendar">` (full page reload) with a wouter `<Link>` / `navigate`. #13 **(decided, Design #2):** Today (`/calendar`) **is** the canonical home — keep the destination but **relabel** "Go to Calendar" → "Go to Today" / "Go home" so the label matches where it lands. |
| `components/molecules/RouteErrorFallback.tsx`                 | #13: same — destination Today is correct; relabel away from "Calendar".                                                                                                                                                                                                                                      |
| `components/molecules/WorkoutCard/WeekNavigation.tsx` (`:22`) | #14 **(decided, Design #2):** the week-grid "Today" button stays **within the grid** — `goToday` → `/calendar/${getCurrentWeekId()}` selecting today; it must **not** leave to the Today summary.                                                                                                            |
| `components/molecules/WorkoutCard/WellnessBadge.tsx`          | #32: normalize `<Link>` vs `navigate()` idiom (behavioral diff in focus/scroll).                                                                                                                                                                                                                             |

**Consistency rule (Design #2):** generic/escape controls resolve to the **Today** summary; surface-local controls (the grid's own "Today") stay **within their surface**. A control never silently switches the user between the summary and the grid.

---

### WP-8 · Health & read-only-view discoverability (additive)

**Severity:** Med–Low · **Fix-risk:** 🟢 Low · **Findings:** #17, #24, #22

| File                                                               | Change                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/pages/health/HealthDashboardPage.tsx`                  | #17: give `/health/{sleep,weight,recovery,activity}` a stable inbound. ⚠ **Readiness:** add a **separate link grid** reusing `WELLNESS_BADGE_ROUTES` — do **not** repurpose the existing `aria-pressed` metric-toggle pills.                                                                                                                                                                                                      |
| Calendar week cards                                                | #24 **(default):** **document `/workout/view/:id` as Today-only** — a real calendar "View" inbound needs a context menu that does not exist (out of scope).                                                                                                                                                                                                                                                                       |
| Today page (`Today.tsx` / `WeekStrip.tsx` / `WeekStripColumn.tsx`) | **#22 (committed — Design #3b + D7 final):** add a **"Trends →" card on Today** → `/health`; keep the desktop header Trends entry; `BOTTOM_NAV_TABS` stays at four — **no Trends tab** (spec-prohibited). ⚠ **Plan gap (do here):** make the **week strip clickable** (today `WeekStripColumn` renders non-interactive `<div>`s) → `/calendar/:weekId`; this is the prerequisite that unblocks WP-4's `resolveEntryHref` removal. |

---

### WP-9 · Settings group rows & anchors

**Severity:** Low · **Fix-risk:** 🟢 Low (AI rows) → ✅ **designed** ([blocker designs](./navigation-blocker-designs.md)) · **Findings:** #26, #34

| File                                                                      | Change                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SettingsPage.tsx` + AI tab views + **new** `use-focus-on-section-change` | #34 **(decided, Design #4):** deep-link + focus a sub-section. ⚠ **Readiness:** `SettingsPage` reads only `useParams(tab)` and `useFocusOnRouteChange` keys on pathname only — build a small `?section=` reader + section-focus hook (reuse `applyFocusToElement`) and add `id`+`tabIndex={-1}` to the AI sub-sections. AI rows become ready once that hook lands. |
| `settings-groups.ts` "Export everything"                                  | #26 **(✅ decided):** no export block exists to anchor to. **Relabel → "Manage your data", re-point → `/settings/privacy?section=data-management`** (icon `upload` → `shield`), landing on the existing **Data Management** block (`PrivacyTab.tsx:52`). Row kept, no export feature built.                                                                        |

**Consistency rule (Design #4):** a navigation row that names a specific thing must land on that specific thing — destination granularity matches label granularity.

---

### WP-10 · Dead code & doc/test cleanup

**Severity:** Low · **Fix-risk:** 🟢 Low · **Findings:** #20, #25

| File                                                                                                                             | Change                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/pages/NewWorkoutPicker.tsx` (+ `NewWorkoutPickerTiles`, `PickerTile`, `TemplatePickerDialog`, `use-*-short-circuit`) | #20: confirm the tree is route-unmounted (audit + critic agree it is) and **delete** it — or port its route-heading + `datedSuffix` date-propagation into the live CreateWorkout path. |
| `docs/navigation-map.md` (`:271`)                                                                                                | #25: remove the false `TemplatePickerDialog` "Opened from" entries (AddEntryChooser/WellnessEntryDialog); mark it orphaned.                                                            |

---

### WP-11 · Back / close / cancel semantics (shared infra — do last)

**Severity:** Med–High · **Fix-risk:** 🔴 High · ✅ **designed** ([blocker designs](./navigation-blocker-designs.md)) · **Findings:** #4, #19, #28
All three need a **source of origin** that the codebase does not currently thread — that's the design
decision gating this package. ⚠ **Readiness (was needs-design — now designed, see [blocker designs](./navigation-blocker-designs.md)):** `grep "from=" src/ = 0`; no
`history.back()`/history-state hook in app code. Smallest unblock: a new **`src/routing/resolve-back-target.ts`**
with an explicit **`?from=<origin>`** contract (origin vocab: `library | calendar | calendar-day | coaching |
today | detail`) — _not_ `history.back()`/wouter `useHistoryState()`, which the audit confirmed are untestable
under the `memoryLocation({record:true})` harness. Then thread `?from=` through ~12 entry call sites and
rewrite 3 pinned tests (`picker-href.test.ts`, `EditorPage.test.tsx`, `WorkoutDetail.test.tsx`).

| File                                                                            | Change                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/pages/use-back-handler.ts` (`:33`,`:50`) + `routing/picker-href.ts` | #4: `buildPickerHref()` always resolves to `/workout/new`, which mounts the AI overlay the user never visited (e.g. opened editor from Library "Load"). Thread origin via `?from=…` or history. #19: edit-mode editor renders no Back button at all — give it an origin/history-derived target. |
| `components/pages/WorkoutDetail/WorkoutDetail.tsx` (`:17`)                      | #28: back hardcodes `/calendar` regardless of where the detail was opened from.                                                                                                                                                                                                                 |

**Risk note:** shared by every editor/detail entry flow; high regression surface. Land WP-1..WP-7 first so this has behavior tests around it.

---

## File → findings index (quick lookup)

| File                                                | Findings                            | Work package |
| --------------------------------------------------- | ----------------------------------- | ------------ |
| `status-entry-defs.ts`                              | #6, #7, #33                         | WP-3, WP-4   |
| `StatusEntryButtons.tsx`                            | #8, #29                             | WP-2, WP-3   |
| `ProfileEntryButton.tsx`                            | #16, #21                            | WP-3         |
| `bottom-nav-tabs.ts`                                | #12, #22                            | WP-2, WP-8   |
| `BottomNav.test.tsx`                                | #30                                 | WP-2         |
| `use-route-announcer-label.ts`                      | #9, #23                             | WP-1         |
| `AthletePageBody.tsx`                               | #10, #31                            | WP-1         |
| `CreateSheetHeader.tsx`                             | #11                                 | WP-1         |
| `AthleteEmptyState.tsx` / `AthletePage.tsx`         | #2                                  | WP-3         |
| `build-workout-record.ts` / `use-create-workout.ts` | #1                                  | WP-5         |
| `new-workout-route.tsx`                             | #5                                  | WP-5         |
| `EditorPage.tsx`                                    | #3, #18                             | WP-5, WP-6   |
| `DateBanner.tsx` / `ScratchEditorSurface.tsx`       | #3                                  | WP-5         |
| `use-import-on-load.ts`                             | #37                                 | WP-5         |
| `Today.tsx` / `WeekStrip.tsx`                       | #22 (Trends link + week-strip→grid) | WP-8, WP-4   |
| `use-dialog-handlers.ts`                            | #18                                 | WP-6         |
| `EditorLoadingState.tsx` / `RouteErrorFallback.tsx` | #13, #15                            | WP-7         |
| `WeekNavigation.tsx`                                | #14                                 | WP-7         |
| `WellnessBadge.tsx` / `WellnessBand.tsx`            | #17, #32                            | WP-7, WP-8   |
| `HealthDashboardPage.tsx`                           | #17                                 | WP-8         |
| `settings-groups.ts`                                | #26, #34                            | WP-9         |
| `AvailableRow.tsx`                                  | #27                                 | WP-4         |
| `NewWorkoutPicker.tsx` tree                         | #20                                 | WP-10        |
| `navigation-map.md`                                 | #25                                 | WP-10        |
| `use-back-handler.ts` / `picker-href.ts`            | #4, #19                             | WP-11        |
| `WorkoutDetail.tsx`                                 | #28                                 | WP-11        |
| `LayoutHeader.test.tsx`                             | (pins #7)                           | WP-4         |

---

## ✅ Resolved design decisions (Claude Design)

The six formerly-blocked questions are decided. Each is folded into the WP indicated; the
**consistency rule** is the reusable principle to apply to future screens, not just this fix.

| #      | Decision                                                                                                                                                                                                                                                                                                                                 | Was-blocking  | Folded into                                                                | Consistency rule                                                                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | A blank/scratch workout started from a calendar day **schedules onto that day** (match import); keep the banner; add a secondary "Save as draft (unscheduled)".                                                                                                                                                                          | #3            | WP-5                                                                       | Any create flow entered from a dated surface schedules onto that date by default, regardless of sub-path (AI/scratch/import). The entry point determines scheduling, not the authoring method. |
| **D2** | Canonical home = the **Today** summary (`/calendar`). Generic "Calendar"/escape controls → Today (relabel them). The week-grid's own "Today" button stays **within** the grid.                                                                                                                                                           | #13, #14, #35 | WP-7, WP-4                                                                 | Generic/escape nav resolves to Today; surface-local controls stay within their surface. A control never silently switches the user between summary and grid.                                   |
| **D3** | The desktop↔mobile asymmetry is **not** intended. (a) Desktop gets a labeled **"Athlete"** entry; kill the redirect hop. (b) Mobile reaches Trends via a Today link and the week grid via the **week strip** — not a second nav bar.                                                                                                     | #6, #22       | WP-3, WP-4, WP-8                                                           | Primary destinations are **breakpoint-invariant**; only the chrome (header row vs bottom bar + FAB) adapts. Secondary surfaces are reached by in-context links, never a parallel second nav.   |
| **D4** | Settings-index rows **deep-link to + focus the specific sub-section**, not the tab top.                                                                                                                                                                                                                                                  | #26, #34      | WP-9                                                                       | A row that names a specific thing must land on that specific thing — destination granularity matches label granularity.                                                                        |
| **D5** | Every route renders a **stable, focusable `<h1>` from first paint** (route shell, not data payload); only the body swaps by state. Copy: Athlete→"Athlete", New→"New session", Today→"Today".                                                                                                                                            | #11, #36      | WP-1                                                                       | Every route owns a stable, focusable heading present from first paint; data states change the body, never the route's name. Navigation always lands on a named surface.                        |
| **D6** | The persist/schedule boundary **rejects calendar-impossible dates** via a true round-trip parse; the shape regex stays as a cheap first-pass gate.                                                                                                                                                                                       | #37           | WP-5                                                                       | Validate at the boundary that enforces the invariant, with semantic (not just syntactic) checks — shape gates input, a real parse guards persistence.                                          |
| **D7** | **Settled: Trends stays a link/card, not a tab.** A tab is **spec-prohibited** (`spa-routing` SHALL-NOT, `:127`/`:206`) and the code already conforms; Today already shows the wellness data, so a "Trends →" card is a detail-drill, not a new tab. The measured rule is only a **future trip-wire** (and would need a spec amendment). | #22           | WP-8 + [§D7](#-d7--trends-tab-vs-link--settled-linkcard-consistency--spec) | The most consistent option is usually already encoded in the spec + existing components — check those before reaching for a measurement.                                                       |

**Overarching principle:** _Destinations are universal; chrome and context adapt_ (see the
callout at the top). Every control should (a) land on a stable, named surface, (b) honor its
entry-point context, and (c) match its destination's specificity to its label's specificity.

### 📊 D7 — Trends tab vs link → **settled: link/card** (consistency + spec)

**Resolved pragmatically** (5-agent evidence workflow, all 3 lanes "link" at high confidence,
adversary-confirmed it does not flip): Trends stays a **link/card, not a tab** — and this is not a
preference, **a tab is spec-prohibited**. `openspec/specs/spa-routing/spec.md` normatively mandates
Trends/Health be a **header entry, NOT a primary tab** (`:127` "SHALL NOT be reached via a primary
navigation tab", `:206`), and two scenarios assert verbatim "no primary navigation tab bar is
present" (`:137`, `:213`). The code already conforms (4-tab `BOTTOM_NAV_TABS` with Trends excluded;
Trends in header `ENTRY_DEFS → /health`; health sub-routes reached by in-page wellness-badge links),
and **Today already composes the same wellness data** (`ReadinessCard` hrv/sleep/battery + `WeekStrip`),
so a "Trends →" card on Today is a **detail-drill of an existing surface**, not a new IA class. A tab
would be the lone outlier — regressing conformant code, demoting a tab, **and amending the spec**.

**Concrete shape (ship this):** keep the desktop header Trends entry as-is; add a **"Trends →" card
on Today** (alongside `ReadinessCard`/`WeekStrip`) → `/health`; leave `BOTTOM_NAV_TABS` at four;
per-metric drill-downs stay on calendar wellness badges. _(Header entry + badges are spec-mandated;
the Today card itself is the D3(b) design choice — the softest, fully-reversible part.)_

**Decision is final — no analytics dependency.** We are not waiting on data: the active spec already
forbids a Trends tab and every component already implements the link, so **link/card is the committed
answer today**. The two analytics probes and the 28-day measurement rule are **dropped from the plan** —
not Phase-1 work, not a pending obligation, nothing to schedule.

_If Kaiord ever chooses to revisit this_, promoting Trends to a tab is a **fresh, explicit IA decision**,
not a standing measurement — it would mean amending `spa-routing` ("four primary tabs" → "demand-ranked")
and demoting **Settings → a header gear** (bar becomes `[Today] [Library] (＋) [Athlete] [Trends]`, which
would actually _increase_ desktop↔mobile symmetry since desktop already parks Settings in the header).
That's a deliberate proposal to raise at that time — out of scope here.
