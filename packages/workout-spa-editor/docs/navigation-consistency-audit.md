# Workout SPA Editor — Navigation Consistency Audit

Scope: a diagnostic-only audit of navigation consistency in `@kaiord/workout-spa-editor` (React + wouter + Tailwind + Dexie), built on `packages/workout-spa-editor/docs/navigation-map.md`. Findings came from 9 detective lanes (label-target, breakpoint-asymmetry, redirect-hops, orphan-unreachable, dangling-shadowed, back-nav, active-state-aria, deep-link-params, meta-novel) and each was put through an adversarial verification pass. No code was changed; every "Fix hint" is a suggestion, not an action. Findings reported by multiple lanes are deduplicated below.

## Executive summary

Confirmed (post-dedup): **22**. Uncertain (needs product decision): **4**. Refuted: **8**.

By severity (confirmed only): High **5** · Medium **8** · Low **9**.

By category (confirmed only): deep-link/date-param **3** · back-nav **3** · active-state/aria **5** · label-mismatch **3** · breakpoint-asymmetry **3** · orphan/dead-nav **4** · redirect/idiom **1**.

Top 5 issues:

1. **AI Create overlay silently drops `?date=`** — a calendar-day "+" creates the workout on _today_, not the chosen day (high).
2. **`?source=scratch` ignores `?date=` while the DateBanner still claims "Creating workout for X"** — misleading affordance, no calendar persist (high/medium).
3. **Athlete "Create profile" redirect loop** — empty-state CTA bounces `/settings/profile → /athlete` and never reaches a creation surface (high).
4. **Editor "Back" in scratch/import mode ignores origin** — always returns to the AI Create overlay the user never visited (high/medium).
5. **Header "Settings" gear → `/settings/ai` while mobile Settings tab → `/settings`** — same label, divergent target; the index is desktop-orphaned (medium, the calibration baseline).

## Confirmed findings

### Deep-link / date-param handling

#### AI Create overlay silently drops `?date=` (workout dated today)

|            |                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | **High**                                                                                                                                                                                                      |
| Confidence | High                                                                                                                                                                                                          |
| Surfaces   | Calendar day "+" → AddEntryChooser Workout; RawWorkout "manual"; `/workout/new?date=` dispatcher; CreateWorkout AI overlay save                                                                               |
| Evidence   | `new-workout-route.tsx:13-16`; `use-add-entry-chooser.ts:22`; `RawWorkoutContent.tsx:52`; `CreateWorkout/build-workout-record.ts:35` (`date: todayDate()`); `use-create-workout.ts` (never reads `useSearch`) |
| Expected   | A workout created from a calendar day's "+" (`/workout/new?date=2026-06-10`) persists on that day.                                                                                                            |
| Actual     | With only `?date=`, `NewWorkoutRoute` renders the AI overlay, which never reads the search string; `buildWorkoutRecord` hardcodes `date: todayDate()`, so the record is always saved on today.                |

Why it's inconsistent: two branches of the same `/workout/new` route handle `?date=` divergently — the import/scratch/template branches honor it, the default (AI) branch silently discards it. A param emitted by a primary entry point is dead on the default-rendered surface, producing a wrong scheduled date with no error.
Fix hint: have `useCreateWorkout`/`buildWorkoutRecord` read `?date=` via `useSearch` and thread it into the record (fall back to `todayDate()`).

#### `?source=scratch` ignores `?date=` while DateBanner promises the chosen day

|            |                                                                                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | **High** (verifier-adjusted to Medium)                                                                                                                                                                                                                            |
| Confidence | High                                                                                                                                                                                                                                                              |
| Surfaces   | `/workout/new?source=scratch&date=`; EditorPage DateBanner; ScratchEditorSurface; SaveButton (file export)                                                                                                                                                        |
| Evidence   | `EditorPage.tsx:70` (`{!id && dateParam && <DateBanner date={dateParam} />}`); `DateBanner.tsx:26` ("Creating workout for {formatted}"); `ScratchEditorSurface.tsx` (never reads date); `SaveButton/use-save-workout.ts:24` (file export, not a calendar persist) |
| Expected   | If a "Creating workout for June 10" banner renders, saving should persist onto June 10, like the import path does.                                                                                                                                                |
| Actual     | Scratch seeds an empty in-memory workout (sport/name only) and never reads `?date=`; its only save is a file-to-disk export. The banner is purely decorative; the date is never wired into any persisted record.                                                  |

Why it's inconsistent: the identical DateBanner backs divergent outcomes — import honors the date (persists + routes to `/workout/:id`), scratch drops it. The user is told the date matters when it does not.
Fix hint: consume `?date=` in the scratch save path, or gate DateBanner to import mode only so scratch does not show a promise it cannot keep.

#### Process action deep-links `/workout/:id?comments=…` that EditorPage never reads

|            |                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                             |
| Confidence | High                                                                                                                                                                               |
| Surfaces   | RawWorkoutDialog Process button; CalendarDialogs; EditorPage (`/workout/:id`)                                                                                                      |
| Evidence   | `use-dialog-handlers.ts:30` (`?comments=${commentIndices.join(",")}`); `EditorPage.tsx:36` (reads only `date`); `render-new-workout-surface.tsx:11` (reads only `action`/`source`) |
| Expected   | The selected comment indices threaded into the URL should be consumed by the editor (pre-select/apply).                                                                            |
| Actual     | `handleProcess` builds the `?comments=` deep link, but no destination reads `comments` (repo-wide grep finds only the writer). The param is silently dropped.                      |

Why it's inconsistent: a one-sided URL contract — the only reason to thread `commentIndices` through the URL is for the editor to act on them.
Fix hint: consume `?comments=` in EditorPage, or drop the param and pass selection via store/state.

### Back-navigation coherence

#### Editor "Back" (scratch/import) ignores Library/Calendar origin

|            |                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | **High** (verifier-adjusted to Medium)                                                                                                                                                                                                 |
| Confidence | High                                                                                                                                                                                                                                   |
| Surfaces   | EditorPageHeader BackButton (new mode); `/workout/new?source=scratch`; `/workout/new?action=import`; LibraryPage Load; WellnessEntryDialog import                                                                                      |
| Evidence   | `use-back-handler.ts:33` (`backTarget = buildPickerHref(dateParam)`); `routing/picker-href.ts:2` (always `/workout/new[?date=]`); `LibraryPage.tsx:78`; `new-workout-route.tsx:16`; `wellness-import-action.tsx:19`                    |
| Expected   | Back from a scratch editor opened via Library "Load" should return to `/library`; import opened via the Wellness dialog should return to the calendar of origin.                                                                       |
| Actual     | `buildPickerHref` always resolves to `/workout/new`, which mounts the **AI Create overlay** the user never visited. The original picker rendered at `/workout/new` made back-to-picker coherent; that route now renders CreateWorkout. |

Why it's inconsistent: the back target is hardcoded to the dispatcher route regardless of origin; the picker→CreateWorkout swap left the back affordance pointing at an unrelated surface. (The nav map's documented edge `…→ /library or /calendar via buildPickerHref` is itself wrong — `buildPickerHref` can never produce `/library`.)
Fix hint: thread origin into the back target (`?from=…` or navigation history) instead of unconditionally returning `buildPickerHref()`.

#### CreateWorkout overlay Close/X always navigates to `/calendar`, dropping `?date=`

|            |                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | **High** (verifier-adjusted to Medium)                                                                                                                  |
| Confidence | High                                                                                                                                                    |
| Surfaces   | CreateWorkout overlay; CreateSheetHeader Close (X); CreateInputPhase onClose; Calendar AddEntryChooser Workout                                          |
| Evidence   | `new-workout-route.tsx:16` (`onClose={() => navigate("/calendar")}`); `use-add-entry-chooser.ts:22` (`/workout/new?date=…`); `CreateSheetHeader.tsx:16` |
| Expected   | Closing the overlay reached from a calendar day "+" should return to the originating context.                                                           |
| Actual     | `onClose` is hardcoded to `/calendar` (Today) and never reads `?date=`, discarding the date context and landing on Today.                               |

Why it's inconsistent: the sibling scratch/import branch forwards `dateParam` via `buildPickerHref`, so the date is honored in one new-workout branch but dropped in the CreateWorkout branch — an internal asymmetry within one route. (Note: no branch returns to `/calendar/:weekId`; the lost context is the `?date=` param.)
Fix hint: read the date in `new-workout-route` and pass a context-aware `onClose` instead of a constant `/calendar`.

#### Edit-mode editor renders no Back button despite many inbound flows

|            |                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Severity   | Medium                                                                                                                                                                         |
| Confidence | High                                                                                                                                                                           |
| Surfaces   | EditorPage edit mode; EditorPageHeader; Calendar ready card; CoachingActivityDialog; RawWorkoutDialog Process; WorkoutDetail Edit; Library load result                         |
| Evidence   | `EditorPage.tsx:39`; `use-back-handler.ts:50` (`return backTarget ? handleBack : null`); `EditorPageHeader.tsx:28` (`{onBack && <BackButton …/>}`); `use-calendar-state.ts:45` |
| Expected   | An edit-mode editor opened from Calendar/coaching/Raw/Detail/Library should offer a Back control.                                                                              |
| Actual     | `useBackHandler` returns `null` for any `/workout/:id` edit, so no BackButton renders; "new" mode shows one, "edit" mode shows none.                                           |

Why it's inconsistent: back-affordance presence diverges across the two editor modes that share `EditorPageHeader`, even though edit mode is reached via deep links and dialogs with a clear origin. (Verifier note: the null return is _documented and test-locked_ as intentional, but no rationale justifies it given the inbound edges, and the sibling read-only view route _does_ provide a back chevron — so this is a UX-consistency question rather than a clear defect.)
Fix hint: provide an edit-mode back target (browser history or origin-derived) so the BackButton renders consistently.

### Active-state & ARIA announcements

#### Desktop StatusHeader primary nav has no active-state / `aria-current` on any route

|            |                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                                                                 |
| Confidence | High                                                                                                                                                                                                                   |
| Surfaces   | LayoutHeader StatusEntryButtons (Calendar/Library/Trends/New/Settings); ProfileEntryButton; BottomNav tabs (mobile)                                                                                                    |
| Evidence   | `StatusEntryButtons.tsx:21` (plain Button, no `aria-current`/active styling; `useLocation` destructured as `[, navigate]`); `BottomNavTab.tsx:20` (`aria-current={active ? "page" : undefined}`), `:16` (active color) |
| Expected   | Both navs should mark the current entry active (`aria-current` + styling) on a given route.                                                                                                                            |
| Actual     | Header entries render plain Buttons that never read location; the mobile BottomNav sets `aria-current="page"` + active color via `isTabActive`. Desktop SR/sighted users get no "you are here" signal.                 |

Why it's inconsistent: identical destinations are highlighted on mobile but never on desktop — inconsistent active-state semantics across breakpoints for the same logical nav.
Fix hint: derive active state in `StatusEntryButtons` from `useLocation()` (mirror `isTabActive`) and set `aria-current` + active variant.

#### Route announcer labels `/athlete` as "Calendar page"

|            |                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Severity   | Medium                                                                                                                                                                                                                   |
| Confidence | High                                                                                                                                                                                                                     |
| Surfaces   | route announcer aria-live region; `/athlete`; BottomNav Athlete tab                                                                                                                                                      |
| Evidence   | `use-route-announcer-label.ts:34-47` (no `/athlete` branch; trailing `return "Calendar page"`); `AthletePageBody.tsx:27-29` (`<h1>Athlete</h1>`); test table `use-route-announcer-label.test.tsx:28-35` omits `/athlete` |
| Expected   | `/athlete` should announce "Athlete page", matching the `<h1>` and the "Athlete" nav tab.                                                                                                                                |
| Actual     | `/athlete` matches no branch and hits the catch-all "Calendar page"; SR users are told they landed on Calendar while on the Athlete page.                                                                                |

Why it's inconsistent: nav control = "Athlete", heading = "Athlete", SR announcement = "Calendar page" — three different words for one destination, and the hook's own JSDoc says labels must not collide with the page `<h1>`.
Fix hint: add `if (pathname === "/athlete") return "Athlete page";` before the calendar fall-through, and add an `/athlete` row to the announcer test table.

#### Athlete route heading is not focusable (missing `tabIndex={-1}`)

|            |                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                                                                 |
| Confidence | High                                                                                                                                                                                                                   |
| Surfaces   | `/athlete`; AthletePageBody; BottomNav Athlete tab; ProfileEntryButton                                                                                                                                                 |
| Evidence   | `AthletePageBody.tsx:18` (`{ [ROUTE_HEADING_ATTR]: true }`), `:27` (`<h1 …>` with no `tabIndex`); contrast `CalendarPageView.tsx:24` (`<h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }}>`)                          |
| Expected   | The Athlete `<h1>` should match every sibling: `tabIndex={-1}` + attr `""` so `useFocusOnRouteChange` can move focus.                                                                                                  |
| Actual     | The heading omits `tabIndex={-1}` (a plain `<h1>` is not programmatically focusable) and sets the attr to boolean `true`; the selector still matches, so `focus()` runs on a non-focusable element and silently fails. |

Why it's inconsistent: it is the single route heading in the app deviating from the established `tabIndex + ""` pattern, breaking focus-on-route-change equity for `/athlete` only. (The boolean-vs-`""` value is cosmetic; the missing `tabIndex` is load-bearing.)
Fix hint: change to `<h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }}>`; drop the bespoke boolean constant.

#### `/workout/new` default surface (CreateWorkout) renders no route heading

|            |                                                                                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                                                                              |
| Confidence | High                                                                                                                                                                                                                                |
| Surfaces   | CreateWorkout overlay; CreateSheetHeader; header New entry; BottomNav FAB                                                                                                                                                           |
| Evidence   | `CreateSheetHeader.tsx:12` (`<h1>` with neither `data-route-heading` nor `tabIndex`); `new-workout-route.tsx:16`; `use-focus-on-route-change.ts:88` (warns + falls back to `document.body` after 5s)                                |
| Expected   | Like every other routed page, the `/workout/new` default surface should render a heading carrying `data-route-heading` + `tabIndex={-1}`.                                                                                           |
| Actual     | CreateSheetHeader's `<h1>` carries neither; entering `/workout/new` finds no heading, observes the DOM 5s, `console.warn`s, and strands focus on the click-source button. The orphaned `NewWorkoutPicker` _does_ carry the heading. |

Why it's inconsistent: the AI Create surface is the lone routed destination missing the focus/announcement contract, producing a divergent experience and a recurring warning only on this route.
Fix hint: add `tabIndex={-1}` + `ROUTE_HEADING_ATTR` to CreateSheetHeader's `<h1>` (matching `EditorPageHeader`), or mount a route heading in `NewWorkoutRoute`'s default branch.

#### Week calendar (`/calendar/:weekId`) highlights no bottom-nav tab

|            |                                                                                                                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                                                                                                                                        |
| Confidence | High                                                                                                                                                                                                                                                                                          |
| Surfaces   | `/calendar/:weekId` (CalendarPage); BottomNav Today tab; header Calendar entry (resolveEntryHref → `/calendar/:weekId`)                                                                                                                                                                       |
| Evidence   | `bottom-nav-tabs.ts:26-29` (`/calendar` branch: exact `/calendar` or `/` only) vs `:30-32` (Settings uses `startsWith("/settings/")`); `status-entry-defs.ts:57`; `AppRoutes.tsx:34`                                                                                                          |
| Expected   | On the week grid (a first-class calendar destination wired from the header), the Today/calendar tab should stay highlighted, like Settings' prefix match.                                                                                                                                     |
| Actual     | `isTabActive("/calendar", …)` is true only for exact `/calendar` or `/`, so on `/calendar/2026-W18` **no** tab is active — an orphaned active-state. A sibling hook (`use-route-announcer-label.ts:45`) treats `startsWith("/calendar")` as the calendar family, so two nav modules disagree. |

Why it's inconsistent: inconsistent prefix-matching policy — Settings highlights across its subtree, the calendar tab does not, despite `/calendar/:weekId` being a header-wired destination.
Fix hint: broaden the calendar branch to also match `location.startsWith("/calendar/")`, mirroring the Settings rule.

### Label-vs-target mismatches

#### Multiple "Go to Calendar" CTAs land on Today, not the week grid

|            |                                                                                                                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                                                                                                                                              |
| Confidence | High                                                                                                                                                                                                                                                                                                |
| Surfaces   | EditorNoData "Go to Calendar"; RouteErrorFallback "Go to Calendar"; WorkoutDetailNotFound "Back to calendar"                                                                                                                                                                                        |
| Evidence   | `AppRoutes.tsx:33` (`/calendar` → `TodayPage`); `EditorLoadingState.tsx:21` (`<a href="/calendar">Go to Calendar</a>`); `RouteErrorFallback.tsx:33` (`navigate("/calendar")`); `WorkoutDetailNotFound.tsx` via `WorkoutDetail.tsx:17` (`onBack = navigate("/calendar")`); `status-entry-defs.ts:57` |
| Expected   | "Go to Calendar" / "Back to calendar" should land on the week grid (`/calendar/:weekId`) — the same target `resolveEntryHref` produces.                                                                                                                                                             |
| Actual     | All three navigate to bare `/calendar`, which renders **Today**, not CalendarPage.                                                                                                                                                                                                                  |

Why it's inconsistent: the codebase already special-cased the header Calendar entry (`resolveEntryHref` rewrite) precisely because `/calendar` is Today; these CTAs never got the same treatment, so their "Calendar" label names a destination they do not reach.
Fix hint: route these through `/calendar/${getCurrentWeekId()}`, or relabel them "Go to Today" / "Go home".

#### Week-grid "Today" button leaves the calendar surface

|            |                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                           |
| Confidence | High                                                                                                                                                                             |
| Surfaces   | `/calendar/:weekId` WeekNavigation; prev/next/Today cluster; CalendarHeader                                                                                                      |
| Evidence   | `WeekNavigation.tsx:20-21` (prev/next → `/calendar/:weekId`), `:22` (`goToday = navigate("/calendar")`), `:48` ("Today" label); `status-entry-defs.ts:57`; `AppRoutes.tsx:33-34` |
| Expected   | In a prev/next/today cluster, "Today" should jump to the current week within the same grid (`/calendar/${getCurrentWeekId()}`).                                                  |
| Actual     | `goPrev`/`goNext` stay on the week grid, but `goToday` navigates to bare `/calendar` (Today summary), ejecting the user mid-flow.                                                |

Why it's inconsistent: adjacent controls mix "move within grid" (prev/next) with "leave grid" (today). Git history shows `goToday` predates the `/calendar`→Today aliasing flip; the header entry got the `resolveEntryHref` rewrite but `goToday`'s stale `navigate("/calendar")` was missed.
Fix hint: change `goToday` to `navigate(\`/calendar/${getCurrentWeekId()}\`)`(already exported from`utils/week-utils`).

#### `/workout/view/:id` (read-only) is announced as "Edit workout"

|            |                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Severity   | Low                                                                                                                                                                      |
| Confidence | High                                                                                                                                                                     |
| Surfaces   | route announcer; `/workout/view/:id`; Today PlannedSessionCard "Details" button                                                                                          |
| Evidence   | `use-route-announcer-label.ts:38` (`if (pathname.startsWith("/workout/")) return "Edit workout"`); `WorkoutDetailHeader.tsx:21` (`<h1>Workout</h1>`); `AppRoutes.tsx:38` |
| Expected   | The read-only detail route should announce something matching its "Workout" heading (e.g. "Workout page"), distinct from the editable `/workout/:id`.                    |
| Actual     | `startsWith("/workout/")` matches both routes, so the read-only sheet announces "Edit workout" though it is non-editable (Edit is a separate footer button).             |

Why it's inconsistent: the announcer conflates the read-only detail route with the editor route; the same prefix-match class as the `/athlete` fall-through.
Fix hint: add `if (pathname.startsWith("/workout/view/")) return "Workout page";` before the generic `/workout/` branch; cover both routes in the test table.

### Breakpoint asymmetry

#### Settings: header gear → `/settings/ai`, mobile tab → `/settings`; index is desktop-orphaned (baseline)

|            |                                                                                                                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                                                                                                                                                    |
| Confidence | High                                                                                                                                                                                                                                                                                                      |
| Surfaces   | StatusHeader Settings gear (desktop); BottomNav Settings tab (mobile); `/settings` index; `/settings/ai`                                                                                                                                                                                                  |
| Evidence   | `status-entry-defs.ts:49` (`to: "/settings/ai"`, label "Settings", aria "Open settings"); `StatusEntryButtons.tsx:62` (`navigate(settingsEntry.to)`, not via `resolveEntryHref`); `bottom-nav-tabs.ts:17` (`/settings`); `SettingsPage.tsx:34` (index Back button rendered only when `tab !== undefined`) |
| Expected   | A generically-labeled "Settings"/"Open settings" control should reach the index, matching the mobile tab; both breakpoints should converge.                                                                                                                                                               |
| Actual     | The desktop gear deep-links to the AI tab; the mobile tab reaches the grouped index. The index (Units/Notifications/Sync/Privacy/Extensions/Usage) has **no direct desktop inbound** — reachable only via the in-page tab Back button or a typed URL.                                                     |

Why it's inconsistent: same label, divergent target across breakpoints; the sibling "calendar" entry got a documented `resolveEntryHref` special-case while "settings" did not, and the generic `ariaLabel` contradicts the AI-specific destination. (This consolidates three lane reports: `header-settings-gear-goes-to-ai-tab`, `settings-index-no-desktop-entry-divergent-target`, `settings-index-desktop-orphan`.)
Fix hint: point the header Settings entry at `/settings` (matching the mobile tab and the generic label); reserve `/settings/ai` for the explicitly AI-contextual call sites.

#### Athlete has a mobile bottom-nav tab but no desktop nav entry (desktop reaches it only via a redirect hop)

|            |                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | High (verifier-adjusted to Medium)                                                                                                                                                                                                                                                                                                                        |
| Confidence | High                                                                                                                                                                                                                                                                                                                                                      |
| Surfaces   | BottomNav Athlete tab (mobile); StatusHeader (all widths); ProfileEntryButton; `/settings/profile` redirect; `/athlete`                                                                                                                                                                                                                                   |
| Evidence   | `bottom-nav-tabs.ts:16` (`Athlete → /athlete`, only direct link); `BottomNav.tsx:23` (`md:hidden`); `status-entry-defs.ts:15` (ENTRY_DEFS has no athlete entry); `ProfileEntryButton.tsx:20` (`navigate("/settings/profile")`); `AppRoutes.tsx:44-45` (Redirect → `/athlete`)                                                                             |
| Expected   | `/athlete` reachable via persistent on-screen nav at both breakpoints, like Library.                                                                                                                                                                                                                                                                      |
| Actual     | Below md the bottom-nav tab gives direct access; at/above md the bottom nav is hidden and the header has no athlete entry, so the only desktop path is ProfileEntryButton → `/settings/profile` → redirect → `/athlete` — an indirection through a settings-namespaced URL, behind an icon-only button labeled by the active profile name, not "Athlete". |

Why it's inconsistent: a first-class routed screen becomes nav-orphaned on desktop, forcing users through an unrelated "profile/settings" redirect; the two breakpoints expose divergent primary destinations. (Consolidates `athlete-no-desktop-nav-entry` + `athlete-desktop-redirect-only`.)
Fix hint: add an "Athlete" entry to ENTRY_DEFS (and the `primaryNav` filter), or make ProfileEntryButton navigate directly to `/athlete` and align its label/aria with the Athlete tab.

#### Health/Trends hub and week Calendar are absent from the mobile bottom nav

|            |                                                                                                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Low                                                                                                                                                                                                                                                |
| Confidence | High                                                                                                                                                                                                                                               |
| Surfaces   | BottomNav (4 tabs); StatusHeader Trends + Calendar entries; `/health`; `/calendar/:weekId`                                                                                                                                                         |
| Evidence   | `bottom-nav-tabs.ts:13-18` (Today/Library/Athlete/Settings only); `status-entry-defs.ts:31` (`trends → /health`), `:57` (calendar → `/calendar/:weekId`); `BottomNav.tsx:23` (`md:hidden`); `StatusEntryButtons.tsx:30` (label `hidden sm:inline`) |
| Expected   | Primary hubs reachable on desktop should be discoverable from the mobile primary nav, or rely on a documented secondary path.                                                                                                                      |
| Actual     | The bottom nav omits Trends and the week grid; on mobile both are reachable only via the icon-only header buttons (the header is not `md`-gated). The mobile "primary" nav exposes a different, smaller destination set than desktop.              |

Why it's inconsistent: header and bottom-nav primary sets are not symmetric; Trends and the week grid are first-class in the header but invisible in the mobile primary nav. (Note: removing the _Health primary tab_ is itself spec-mandated — see refuted findings — but the discoverability gap on mobile is real. Consolidates `calendar-week-not-in-bottomnav` + `health-hub-not-in-bottomnav`; the Health-active-state variant is likewise covered.)
Fix hint: confirm intended mobile IA — add bottom-nav entries (with prefix-match `isTabActive`) or an in-page "View week" / Trends link, or document the header row as the secondary mobile nav for these.

### Orphans, dead nav, and dangling targets

#### Athlete empty-state "Create profile" redirects in a loop, never reaching a creation surface

|            |                                                                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | **High**                                                                                                                                                                                                                                                                                          |
| Confidence | High                                                                                                                                                                                                                                                                                              |
| Surfaces   | `/athlete` empty state; AthleteEmptyState "Create profile"; `/settings/profile` redirect                                                                                                                                                                                                          |
| Evidence   | `AthleteEmptyState.tsx:14` (`navigate("/settings/profile")`); `AppRoutes.tsx:44` (Redirect → `/athlete`); `AthletePage.tsx:13` (no-profile → `<AthleteEmptyState />`); `AthleteIdentity.tsx:42` (ProfileEditDialog only in the populated branch)                                                  |
| Expected   | "Create profile" should open a profile-creation dialog so a user with no profile can create one.                                                                                                                                                                                                  |
| Actual     | It navigates to `/settings/profile`, which redirects to `/athlete`; with still no profile, `AthletePage` re-renders the same empty state. The creation dialog lives only in the _populated_ branch, so the redirect loops back with no progress. No `?create` query / auto-open mechanism exists. |

Why it's inconsistent: the button's own comment relies on `/settings/profile` redirecting "once a profile exists", but that redirect provides no creation entry point in the no-profile case — a dead loop blocking first-time profile creation.
Fix hint: open a creation dialog in-place from AthleteEmptyState, or auto-open ProfileManagerDialog in create mode on `/athlete` when no profile exists.

#### Health sub-routes have only a data-gated inbound; the dashboard links to none of them

|            |                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                                                                                                                                                                             |
| Confidence | High                                                                                                                                                                                                                                                                                                                               |
| Surfaces   | WellnessBadge / WellnessBand; HealthDashboardPage; StatusHeader Trends entry                                                                                                                                                                                                                                                       |
| Evidence   | `WellnessBand.tsx:25` (`if (!wellness) return null`), `:33` (per-metric badge hidden unless value present); `wellness-badge-routes.ts:11` (only literals targeting sub-routes); `status-entry-defs.ts:35` (`to: "/health"`, hub only); HealthDashboardPage has zero links to sub-pages                                             |
| Expected   | Each routed sub-page should have at least one always-available on-screen path (e.g., the dashboard linking down to its children).                                                                                                                                                                                                  |
| Actual     | The four health sub-pages (`/sleep`, `/weight`, `/recovery`, `/activity`) are reachable only through WellnessBadge links that render only when a calendar day _and_ that metric have data. With an empty wellness week they are unreachable except by typed URL or post-import redirect; the Trends dashboard offers no path down. |

Why it's inconsistent: a whole route hub is effectively deep-link-only under the common no-data condition, and the natural parent offers no navigation into its children.
Fix hint: add sub-page navigation from HealthDashboardPage (e.g., make each TrendMetric card link to its detail page) so sub-routes have a stable inbound independent of calendar wellness data.

#### Orphaned NewWorkoutPicker tree (page + dialog) is never route-mounted

|            |                                                                                                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium (verifier-adjusted to Low)                                                                                                                                                                                                                                                                                      |
| Confidence | High                                                                                                                                                                                                                                                                                                                   |
| Surfaces   | NewWorkoutPicker; NewWorkoutPickerTiles; PickerTile; TemplatePickerDialog; `?source=template-picker` short-circuit                                                                                                                                                                                                     |
| Evidence   | `NewWorkoutPicker.tsx:13` (default export, not in `AppRoutes`/`lazy-pages`); `new-workout-route.tsx:16` (renders CreateWorkout); `CreateInputPhase.tsx:63` (Template tile → `/library`, the live replacement); `use-library-short-circuit.ts:21` + `use-library-schedule.ts:22` (date short-circuit, no live producer) |
| Expected   | Every page-like component and in-flow dialog is reachable through a mounted route or on-screen control; dead trees are deleted.                                                                                                                                                                                        |
| Actual     | NewWorkoutPicker (and its only-importer dependents) are never mounted; it is the sole live importer of TemplatePickerDialog, and it holds the route heading + `?date=` plumbing the live CreateWorkout surface lacks. The `/library?source=template-picker&date=` direct-schedule machinery has no live producer.      |

Why it's inconsistent: dead navigation code masquerading as a surface — it implies a `/workout/new?date=` picker UX and a dated-schedule short-circuit that the running app does not expose, and it preserves the heading/date contract the replacement silently regressed. (Consolidates `orphan-newworkoutpicker-tree`, `orphan-newworkoutpicker-nav`, `template-picker-source-no-live-producer`, `orphan-newworkoutpicker-has-heading-and-date-plumbing`.)
Fix hint: delete the NewWorkoutPicker/TemplatePickerDialog/short-circuit tree if confirmed dead, or port its route heading + `datedSuffix` date-propagation into the CreateWorkout/NewWorkoutRoute path.

#### `/workout/view/:id` has a single, conditional inbound

|            |                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Low                                                                                                                                                                                           |
| Confidence | High                                                                                                                                                                                          |
| Surfaces   | Today PlannedSessionCard; `/workout/view/:id`; Calendar week (no edge)                                                                                                                        |
| Evidence   | `PlannedSessionCard.tsx:57` (only `navigate("/workout/view/…")` in the app); `AppRoutes.tsx:38`; calendar cards route to the editor (`use-calendar-state.ts:40-48`), never the read-only view |
| Expected   | A read-only view ideally reachable wherever a workout is listed, not just from one conditional card.                                                                                          |
| Actual     | The sole inbound is the Today card, which renders only when a session is planned for _today_; on any other day the read-only screen is unreachable except by typed URL.                       |

Why it's inconsistent: a route whose only on-screen entry is conditional on transient data, while its natural siblings (calendar cards) bypass it for the editor.
Fix hint: add a "View" path from calendar week cards (or a context menu), or document the read-only view as intentionally Today-only.

#### Navigation map lists false TemplatePickerDialog openers

|            |                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Low                                                                                                                                                                                                 |
| Confidence | High                                                                                                                                                                                                |
| Surfaces   | AddEntryChooser; WellnessEntryDialog; TemplatePickerDialog                                                                                                                                          |
| Evidence   | `navigation-map.md:271` (lists AddEntryChooser + WellnessEntryDialog as openers); `AddEntryChooser.tsx:17` and `WellnessEntryDialog.tsx:17` import only `formatDateLabel`, not the dialog component |
| Expected   | The dialogs inventory should list only real opener surfaces.                                                                                                                                        |
| Actual     | Neither dialog imports or renders TemplatePickerDialog; the map overstates its reachability and hides that it is effectively orphaned.                                                              |

Why it's inconsistent: a documented inbound edge that does not exist in code, corroborating that TemplatePickerDialog has no live entry path.
Fix hint: remove AddEntryChooser/WellnessEntryDialog from the "Opened from" column; mark TemplatePickerDialog as orphaned alongside NewWorkoutPicker.

### Redirect hops & navigation idiom

#### EditorNoData uses a raw `<a href>` (full page reload) while every sibling uses wouter

|            |                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium (also reported Low)                                                                                                                                                                                       |
| Confidence | High                                                                                                                                                                                                             |
| Surfaces   | EditorPage no-KRD state (EditorNoData); RouteErrorFallback; WorkoutDetailNotFound                                                                                                                                |
| Evidence   | `EditorLoadingState.tsx:21` (`<a href="/calendar">…</a>` — the only raw internal-nav anchor in the SPA); `RouteErrorFallback.tsx:30` (`navigate("/calendar")`); `WorkoutDetail.tsx:17` (`navigate("/calendar")`) |
| Expected   | An in-app "Go to Calendar" escape should perform client-side wouter navigation, like its siblings.                                                                                                               |
| Actual     | EditorNoData's plain anchor triggers a full document reload (tears down Zustand/Dexie state, re-runs MigrationBoot + tutorial bootstrapping), unlike the parallel `navigate("/calendar")` controls.              |

Why it's inconsistent: the same escape intent is implemented two ways within the editor surface; the anchor variant hard-reloads. (Consolidates `editornodata-hard-reload-anchor` + `editornodata-anchor-full-reload`.)
Fix hint: replace the `<a href>` with a wouter `<Link href="/calendar">` or a Button calling `navigate("/calendar")`.

#### `navigate("/settings/profile")` is a guaranteed double-hop to `/athlete`

|            |                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium (verifier-adjusted to Low)                                                                                                                                                      |
| Confidence | High                                                                                                                                                                                   |
| Surfaces   | ProfileEntryButton; AthleteEmptyState "Create profile"; `/settings/profile` redirect                                                                                                   |
| Evidence   | `ProfileEntryButton.tsx:20`; `AthleteEmptyState.tsx:14`; `AppRoutes.tsx:44` (sole behavior is `<Redirect to="/athlete" />`)                                                            |
| Expected   | Callers wanting the athlete screen should navigate directly to `/athlete`.                                                                                                             |
| Actual     | Both call sites navigate to `/settings/profile`, a pure redirect, pushing an intermediate URL and momentarily lighting the Settings tab (prefix match) before resolving to `/athlete`. |

Why it's inconsistent: a legacy redirect path used by live in-app callers adds an extra hop and a transient wrong active-nav state. (wouter resolves `<Redirect>` synchronously, so user-visible impact is cosmetic — hence Low.)
Fix hint: change the two call sites to `navigate("/athlete")`; keep the `/settings/profile` redirect only for backward-compatible external links.

#### ProfileEntryButton "Open profile manager" lands on the Athlete overview, not a manager

|            |                                                                                                                                                                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | Medium                                                                                                                                                                                                                                                                            |
| Confidence | High                                                                                                                                                                                                                                                                              |
| Surfaces   | StatusHeader ProfileEntryButton (global header); Athlete page; ProfileManagerDialog                                                                                                                                                                                               |
| Evidence   | `ProfileEntryButton.tsx:13` (`"Open profile manager …"` — the only accessible name on mobile, icon-only), `:20` (`navigate("/settings/profile")`); `AppRoutes.tsx:45` (Redirect → `/athlete`); `AthleteIdentity.tsx:31` (manager opens only via a separate "Edit profile" button) |
| Expected   | A control named "Open profile manager" should open the profile manager (or land where it is primary content).                                                                                                                                                                     |
| Actual     | It navigates to `/settings/profile` → `/athlete` (the overview); the actual manager dialog requires a second, separately-labeled "Edit profile" click. The promised "manager" never opens.                                                                                        |

Why it's inconsistent: the aria intent ("profile manager") does not match the destination (Athlete overview); on mobile the aria-label is the only accessible name, so SR users are told the button opens a manager it does not open.
Fix hint: relabel the aria-label to "Open athlete profile", or deep-link to a surface that auto-opens the manager dialog.

### Low-severity consistency warts

These are confirmed but cosmetic / non-functional; grouped for brevity.

| Finding                                                                                                                                  | Severity          | Evidence                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| Settings index "Export everything" → same `/settings/privacy` as "Data & privacy" (no export surface exists)                             | Low               | `settings-groups.ts:42-43`; `PrivacyTab.tsx` has no export section                              |
| Settings index "Provider" & "Custom instructions" both → `/settings/ai` (no section anchor)                                              | Low _(uncertain)_ | `settings-groups.ts:22,25` — see Uncertain                                                      |
| Available "Connect <brand>" row → generic `/settings/extensions` (no per-brand connect)                                                  | Low               | `AvailableRow.tsx:19,29`; placeholder per inline comments                                       |
| WorkoutDetail back / Not-Found hardcode `/calendar`, ignoring non-Today origin                                                           | Low               | `WorkoutDetail.tsx:17`; `WorkoutDetailNotFound.tsx:19`                                          |
| Header "Settings" gear has no active-state on `/settings/ai` while mobile tab does                                                       | Low               | `bottom-nav-tabs.ts:30`; `StatusEntryButtons.tsx:59`                                            |
| BottomNav test pins Settings active on `/settings/profile`, but that redirects to `/athlete` (Athlete tab active at runtime)             | Low               | `BottomNav.test.tsx:63`; `AppRoutes.tsx:44`; `bottom-nav-tabs.ts:30,33`                         |
| AthletePage sets `data-route-heading="true"` while every other page uses `""`                                                            | Low               | `AthletePageBody.tsx:18` vs `SettingsPage.tsx:43`                                               |
| Only WellnessBadge & HeaderLogo use real `<Link>` anchors; all other nav is button+`navigate()` (no open-in-new-tab / link SR semantics) | Low               | `WellnessBadge.tsx:16`; `HeaderLogo.tsx:18`; `StatusEntryButtons.tsx:22`; `BottomNavTab.tsx:18` |
| `/library` uses the lucide `Library` (book) icon in the header but `LayoutGrid` in the bottom nav                                        | Low               | `status-entry-defs.ts:24`; `bottom-nav-tabs.ts:15`; `icon-map.ts:43`                            |

## Needs a product decision (uncertain)

These reproduce in code but are plausibly intentional; each raises an open question rather than a clear defect.

- **`settings-provider-and-custom-instructions-same-ai-tab`** — "Provider" and "Custom instructions" both route to `/settings/ai` with no section anchor. The destination tab genuinely contains a "Custom instructions" section, and the "shortcut rows share one tab" pattern is repeated for the Privacy group, so it looks like deliberate IA. **Open question:** should grouped-index rows deep-link to section anchors (`/settings/ai#custom-prompt`), or is landing at the tab top the accepted pattern? (`settings-groups.ts:22,25`)
- **`weeknav-today-button-leaves-week-grid` / `go-to-calendar-links-land-on-today`** — both restate the `/calendar`=Today aliasing for "Today"/"Calendar"-labeled controls. The confirmed week-nav and "Go to Calendar" findings above already capture the concrete code; the residual question is whether landing on the Today summary is acceptable for recovery/escape controls. **Open question:** is Today the intended "home" landing for these labels, or should every "Calendar"-labeled control reach the week grid? (`WeekNavigation.tsx:22`; `EditorLoadingState.tsx:21`; `RouteErrorFallback.tsx:30`)
- **`today-index-not-in-header-primary-nav`** — mobile "Today" tab → `/calendar` (Today) vs desktop "Calendar" button → `/calendar/:weekId` (week grid): same conceptual slot, divergent label and target. Each landing surface is reachable on the other breakpoint via a secondary control, and the divergence is partly documented. **Open question:** should there be a labeled desktop "Today" entry (and/or a single canonical per-breakpoint calendar target)? (`bottom-nav-tabs.ts:14`; `status-entry-defs.ts:57`; `HeaderLogo.tsx:19`)
- **`athlete-gating-states-no-route-heading`** — the Athlete empty/loading states render no route heading, unlike `WorkoutDetailNotFound`. The loading-spinner portion is the hook-tolerated norm (the Suspense fallback is headingless too), so only the empty-state asymmetry is genuine. **Open question:** should gating/empty states render a stable route heading eagerly (LibraryPage pattern), or is the graceful `console.warn` + body-focus fallback acceptable? (`AthleteEmptyState.tsx:11` vs `WorkoutDetailNotFound.tsx:12`)
- **`iso-date-regex-shape-only-validation`** — `?date=` is gated by a shape-only regex (`/^\d{4}-\d{2}-\d{2}$/`) at the persist boundary, which accepts impossible dates (`2026-13-45`). DateBanner uses `new Date()`, which is also lenient (it rolls `2026-02-31` to March), so it is _not_ a true calendar validator. **Open question:** should the persist/schedule boundaries reject calendar-invalid dates (round-trip parse), given this requires a hand-edited URL and stores a string? (`use-import-on-load.ts:27,57`; `use-library-short-circuit.ts:22`)

## Considered & dismissed (refuted)

Checked and cleared by concrete counter-evidence:

- **`calendar-week-and-trends-no-mobile-bottom-nav-entry`** — Refuted. `openspec/specs/spa-routing/spec.md:125-132,204-213` explicitly mandates Trends/Health be header entries and **not** primary tabs, with scenarios asserting "no primary navigation tab bar is present." The header is intentionally not `md`-gated. (The narrower _discoverability_ gap is retained above as a Low finding.)
- **`label-divergence-today-vs-calendar-same-slot`** — Refuted. The shared base string `/calendar` does not mean a shared destination: `resolveEntryHref` rewrites the desktop entry to the week grid while the mobile tab stays on Today. Each label correctly names its own resolved destination; making them identical would be misleading. (`status-entry-defs.ts:53-58`; `BottomNav.test.tsx:39-47`)
- **`invalid-weekid-redirect-lands-on-today-not-week-grid`** — Refuted. `spa-calendar/spec.md:30-37` normatively requires malformed `weekId` to redirect to `/calendar` (current week = Today landing), which `CalendarPage.tsx:16` implements exactly.
- **`istabactive-dead-root-branch`** — Refuted. BottomNav lives in the persistent `MainLayout` shell, not inside `AppRoutes`; wouter's `<Redirect>` navigates in a deferred layout effect _after_ the initial commit, so there is a real frame where BottomNav observes `location === "/"`. The `|| location === "/"` clause is reachable.
- **`settings-index-rows-no-target`** — Refuted. "Units"/"Notifications" without `to` render as plain non-interactive `<div>`s (no button role, no chevron, no hover), and `SettingsGroupList` withholds the navigate callback. An explicit test (`SettingsPage.test.tsx:111-120`) asserts the Units row is **not** a button — intentional inert placeholders, not dead nav.
- **`trends-no-bottom-nav-representation`** — Refuted (duplicate of the spec-mandated Health/Trends decision above). Same `spa-routing` requirement removes Trends from primary tabs by design.
- **`wellness-import-stale-date-comment`** — Refuted. The comment is explicitly scoped to the FIT health-import flow ("the existing FIT health-import flow") and cites precisely the health-type branch lines, so within its scope ("the import path ignores `?date=`") it is correct; at most a minor wording nit.
- **`workout-route-order-verified-no-shadow`** — Refuted (negative result, by design). `/workout/new` and `/workout/view/:id` are declared before `/workout/:id`, workout ids are `crypto.randomUUID()`, and wouter's `:id` matches a single segment — no shadowing. This entry documents the highest-risk site was inspected and is sound.

## Ranked issue table

| #   | Title                                                                                            | Category             | Severity          | Confidence | Key file:line                              |
| --- | ------------------------------------------------------------------------------------------------ | -------------------- | ----------------- | ---------- | ------------------------------------------ |
| 1   | AI Create overlay drops `?date=` (workout dated today)                                           | deep-link            | High              | High       | `CreateWorkout/build-workout-record.ts:35` |
| 2   | Athlete empty-state "Create profile" redirect loop                                               | orphan/redirect      | High              | High       | `AthleteEmptyState.tsx:14`                 |
| 3   | `?source=scratch` ignores `?date=` while DateBanner promises it                                  | deep-link            | High→Med          | High       | `EditorPage.tsx:70`                        |
| 4   | Editor "Back" (scratch/import) ignores Library/Calendar origin                                   | back-nav             | High→Med          | High       | `picker-href.ts:2`                         |
| 5   | CreateWorkout Close/X drops `?date=`, always → `/calendar`                                       | back-nav             | High→Med          | High       | `new-workout-route.tsx:16`                 |
| 6   | Athlete has no desktop nav entry (redirect-hop only)                                             | breakpoint           | High→Med          | High       | `status-entry-defs.ts:15`                  |
| 7   | Settings header gear → `/settings/ai` vs mobile → `/settings`; index desktop-orphaned (baseline) | label/breakpoint     | Med               | High       | `status-entry-defs.ts:49`                  |
| 8   | Desktop StatusHeader has no active-state / `aria-current`                                        | active-state         | Med               | High       | `StatusEntryButtons.tsx:21`                |
| 9   | Route announcer labels `/athlete` as "Calendar page"                                             | aria-announce        | Med               | High       | `use-route-announcer-label.ts:34-47`       |
| 10  | Athlete route heading not focusable (no `tabIndex`)                                              | aria-announce        | Med               | High       | `AthletePageBody.tsx:18`                   |
| 11  | `/workout/new` default surface renders no route heading                                          | aria-announce        | Med               | High       | `CreateSheetHeader.tsx:12`                 |
| 12  | Week calendar highlights no bottom-nav tab                                                       | active-state         | Med               | High       | `bottom-nav-tabs.ts:26-29`                 |
| 13  | "Go to Calendar" CTAs land on Today, not week grid                                               | label-mismatch       | Med               | High       | `EditorLoadingState.tsx:21`                |
| 14  | Week-grid "Today" button leaves the calendar surface                                             | label-mismatch       | Med               | High       | `WeekNavigation.tsx:22`                    |
| 15  | EditorNoData raw `<a href>` full reload                                                          | redirect/idiom       | Med               | High       | `EditorLoadingState.tsx:21`                |
| 16  | ProfileEntryButton "Open profile manager" lands on Athlete overview                              | label-mismatch       | Med               | High       | `ProfileEntryButton.tsx:13`                |
| 17  | Health sub-routes have only data-gated inbound                                                   | orphan/deep-link     | Med               | High       | `WellnessBand.tsx:25`                      |
| 18  | `?comments=` deep-link never read by EditorPage                                                  | deep-link            | Med               | High       | `use-dialog-handlers.ts:30`                |
| 19  | Edit-mode editor renders no Back button                                                          | back-nav             | Med _(uncertain)_ | High       | `use-back-handler.ts:50`                   |
| 20  | Orphaned NewWorkoutPicker / TemplatePickerDialog tree                                            | orphan               | Med→Low           | High       | `NewWorkoutPicker.tsx:13`                  |
| 21  | `navigate("/settings/profile")` double-hop                                                       | redirect-hop         | Med→Low           | High       | `ProfileEntryButton.tsx:20`                |
| 22  | Trends/Health & week Calendar absent from mobile bottom nav                                      | breakpoint           | Low               | High       | `bottom-nav-tabs.ts:13-18`                 |
| 23  | `/workout/view/:id` announced as "Edit workout"                                                  | aria-announce        | Low               | High       | `use-route-announcer-label.ts:38`          |
| 24  | `/workout/view/:id` single conditional inbound                                                   | orphan               | Low               | High       | `PlannedSessionCard.tsx:57`                |
| 25  | Nav map lists false TemplatePickerDialog openers                                                 | dangling-target      | Low               | High       | `navigation-map.md:271`                    |
| 26  | "Export everything" → same `/settings/privacy` as "Data & privacy"                               | same-label-divergent | Low               | High       | `settings-groups.ts:42-43`                 |
| 27  | "Connect <brand>" → generic `/settings/extensions`                                               | label-mismatch       | Low               | High       | `AvailableRow.tsx:19`                      |
| 28  | WorkoutDetail back hardcodes `/calendar`                                                         | back-nav             | Low               | Med        | `WorkoutDetail.tsx:17`                     |
| 29  | Header Settings gear no active-state on `/settings/ai`                                           | active-state         | Low               | High       | `StatusEntryButtons.tsx:59`                |
| 30  | BottomNav test pins Settings active on redirect-source `/settings/profile`                       | active-state         | Low               | High       | `BottomNav.test.tsx:63`                    |
| 31  | AthletePage `data-route-heading="true"` vs `""` elsewhere                                        | other                | Low               | High       | `AthletePageBody.tsx:18`                   |
| 32  | Link-vs-button nav idiom split                                                                   | other                | Low               | High       | `WellnessBadge.tsx:16`                     |
| 33  | `/library` header (book) vs bottom-nav (grid) icon                                               | label-mismatch       | Low               | High       | `status-entry-defs.ts:24`                  |
| 34  | "Provider"/"Custom instructions" share `/settings/ai` (no anchor)                                | same-label-divergent | Low _(uncertain)_ | High       | `settings-groups.ts:22,25`                 |
| 35  | Today/Calendar same slot, divergent label+target                                                 | same-label-divergent | Low _(uncertain)_ | High       | `bottom-nav-tabs.ts:14`                    |
| 36  | Athlete gating states render no route heading                                                    | aria-announce        | Low _(uncertain)_ | High       | `AthleteEmptyState.tsx:11`                 |
| 37  | Shape-only `?date=` regex accepts impossible dates                                               | other                | Low _(uncertain)_ | Med        | `use-import-on-load.ts:27`                 |

## Coverage notes

- **Audited:** the wouter `<Switch>` in `AppRoutes.tsx`; both primary navs (`StatusHeader` ENTRY_DEFS / StatusEntryButtons and `BottomNav` BOTTOM_NAV_TABS / `isTabActive`); the `resolveEntryHref` calendar special-case; every `navigate()`/`<Link>`/`<a href>`/`<Redirect>` target inventory; deep-link query params (`?date=`, `?source=`, `?action=`, `?comments=`, `?source=template-picker`); back/close affordances across editor modes; the route-announcer label map and `data-route-heading`/`tabIndex` focus contract; and orphan/dead-code trees (NewWorkoutPicker, TemplatePickerDialog, library short-circuit).
- **Cross-checked against specs:** `openspec/specs/spa-routing/spec.md`, `spa-calendar/spec.md`, and archived changes were used to clear refuted findings; the spa-routing spec authoritatively explains the Health/Trends "header entry, not a tab" decision and the invalid-`weekId` → `/calendar` redirect.
- **Recurring root cause:** the `/calendar`→Today aliasing flip (commit `b5fb3738`, mobile-first redesign) and the NewWorkoutPicker→CreateWorkout swap drive most confirmed findings — `resolveEntryHref` was applied to the header Calendar entry but not to `goToday`, the "Go to Calendar" CTAs, or the `isTabActive` calendar branch, and CreateWorkout never inherited the picker's route-heading + `?date=` plumbing.
- **Blind spots / not exercised:** this is static analysis only — no browser run, so transient focus/announcement behavior and the `/`→`/calendar` initial-paint frame were reasoned about (via wouter source + tests) rather than observed; runtime DnD reschedule and coaching-convert flows were traced through code but not executed; and bootstrap profile-seeding (which could mask the Athlete redirect loop for typical users) was not confirmed.
- **Suggested follow-ups:** (1) a single source of truth for the calendar slot's target/label/icon shared by both navs; (2) thread `?date=`/origin through all `/workout/new` branches and the editor back/close handlers; (3) a shared route-heading helper applied uniformly (including CreateWorkout); (4) decide and document the mobile IA for Trends/Health and the Athlete desktop entry; (5) delete or re-wire the orphaned NewWorkoutPicker/TemplatePickerDialog/short-circuit tree and correct the nav-map dialog inventory.
