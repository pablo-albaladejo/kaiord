> Synced: 2026-05-01

# SPA Routing

## Purpose

Routing and surface-classification rules for the SPA editor: how URLs are derived from Vite's deploy base (so deep-linked routes survive refresh under static hosting), and how each top-level UI region is classified as a routed page, a meta modal, or an in-flow picker dialog so feature-drift between dual surfaces cannot recur.

## Requirements

### Requirement: SPA router base alignment with Vite deploy base

The `@kaiord/workout-spa-editor` SPA bootstrap (`packages/workout-spa-editor/src/main.tsx`) SHALL wrap `<App />` in wouter's `<Router>` component with a `base` prop derived from `import.meta.env.BASE_URL`. The derivation SHALL strip the trailing slash that Vite always emits, yielding an empty string in dev (`BASE_URL = "/"` → `base = ""`) or a path without trailing slash in production (`BASE_URL = "/editor/"` → `base = "/editor"`).

The strip is centralised in a pure helper `computeRouterBase(baseUrl: string): string` exported from `packages/workout-spa-editor/src/router-base.ts` so the rule is testable without rendering the JSX tree. Vite's `BASE_URL` always begins and ends with `/` (verified in Vite's `resolveBaseUrl`); the helper relies on that invariant and the unit test catches any future divergence.

The requirement exists to prevent a subpath-deployed SPA from emitting URLs that diverge from the deploy path. Without `<Router base>`, wouter's catch-all `<Redirect to="/calendar" />` writes `/calendar` to the address bar even though the SPA itself is served from `/editor/`. On refresh, GitHub Pages cannot serve `/calendar` because no asset lives at that path, falls back to the landing's blue 404, and the previously-shipped rafgraph fallback (rooted under `cleanup-open-issues-may-2026`, scoped to `/editor/*` paths) does not match. Aligning wouter's base with Vite's deploy base closes this class of bug at the source. The two requirements compose: rafgraph restores the URL pre-mount, then wouter's base resolves the deep route.

A unit test (`packages/workout-spa-editor/src/router-base.test.ts`) SHALL exercise `computeRouterBase` against representative inputs (`/`, `/editor/`, `/a/b/`, ``). An end-to-end test (`packages/workout-spa-editor/e2e/spa-route-refresh.spec.ts`, gated by `E2E_PROD_BASE=1`) SHALL build the SPA with `VITE_BASE_PATH=/editor/`, serve the merged dist via a static file server that returns 404 for unknown paths (no SPA fallback, mimicking GitHub Pages exactly), and verify a deep URL refresh keeps the SPA bundle and the route.

#### Scenario: Wouter is wrapped at SPA bootstrap

- **WHEN** `packages/workout-spa-editor/src/main.tsx` is parsed and rendered
- **THEN** the rendered tree SHALL include a wouter `<Router base={...}>` wrapping `<App />`, where `base` is the value returned by `computeRouterBase(import.meta.env.BASE_URL)`

#### Scenario: computeRouterBase strips the Vite trailing slash

- **WHEN** `computeRouterBase` is invoked with each of `"/"`, `"/editor/"`, `"/a/b/"`, `""`
- **THEN** the helper SHALL return `""`, `"/editor"`, `"/a/b"`, `""` respectively

#### Scenario: Production base produces deploy-prefixed URLs

- **WHEN** the SPA is built with `VITE_BASE_PATH=/editor/` and a user navigates from the SPA root to the calendar route
- **THEN** the address bar SHALL read a URL prefixed with `/editor/` (e.g. `/editor/calendar`), NOT a root-relative URL (`/calendar`)

#### Scenario: Refreshing a deep SPA URL keeps the SPA

- **WHEN** the SPA is served via a static file server that returns 404 for unknown paths (no SPA fallback) and the user refreshes a deep URL such as `/editor/calendar`
- **THEN** the static host SHALL serve the merged-dist `404.html`, the previously-shipped rafgraph fallback SHALL restore the URL pre-mount (per the existing rafgraph injection helper at `scripts/inject-spa-fallback.mjs`), the SPA's router SHALL strip the configured base before route matching, and the calendar view SHALL re-render — no blue 404 page

#### Scenario: Dev-mode behaviour is unchanged

- **WHEN** the SPA runs under `pnpm dev` (Vite dev server, `BASE_URL = "/"`) and a user navigates to the calendar route
- **THEN** the address bar SHALL read `/calendar` with no `/editor/` prefix; wouter base resolves to the empty string in dev so this scenario asserts the fix is non-disruptive at the dev path

#### Scenario: Analytics paths remain base-relative

- **WHEN** the SPA runs in production base (`/editor/`) and the user navigates to the calendar route, triggering an analytics page-view event
- **THEN** the analytics emitter SHALL have been invoked at least once (guards against a future refactor that silently stops emitting page views), AND the captured path SHALL be `/calendar` (the router's base-stripped value), NOT `/editor/calendar`. Existing analytics dashboards see the same paths as before the fix

#### Scenario: Garbage path under the deploy base resolves to the catch-all

- **WHEN** a user requests `/editor/<malformed-path>` directly (cold) on a Pages-equivalent host
- **THEN** the rafgraph round-trip SHALL restore the URL, the SPA's router SHALL strip the configured base, the SPA's catch-all route SHALL redirect to the canonical calendar route, the URL bar SHALL settle at `/editor/calendar`, and no infinite redirect loop or XSS SHALL occur (the address bar containing user-supplied characters is treated as a path string by `history.replaceState`, never as HTML)

### Requirement: SPA surface classification (routed-page vs modal)

Each SPA editor surface (top-level UI region invoked from a header button or from in-flow controls) SHALL be classified as exactly one of:

- **Routed page** — owns a base-relative URL (resolved per the SPA router base alignment requirement), supports browser history, deep-linking, bookmarking, and external linking. Used for **content destinations** (places the user returns to deliberately, that have meaningful internal navigation and state).
- **Modal — meta** — modal dialog, no URL, mounted from the navigation header. Used for **preferences and auxiliary surfaces** that configure or describe the parent context without representing primary content.
- **Modal — in-flow picker** — modal dialog, no URL, mounted by a parent route's controls and bound to that parent's transient state (e.g., a date, a selected day). Returns a selection to the caller via callback. UI is intentionally narrow (selection-only, no destination affordances such as delete or edit).

A surface SHALL NOT exist as both a routed page AND a header-mounted modal that share the same content component, because feature drift between the two surfaces is otherwise inevitable. If both browse-and-manage and pick-in-flow are needed for the same content, the page covers the former and a separate narrow picker dialog covers the latter.

The Workout Library is the canonical case: the `/library` page is the destination; a narrow template picker dialog (mounted by the calendar's empty-day flow with a `date` prop) is the in-flow picker. URLs referenced in this requirement (e.g. `/library`, `/calendar`) are base-relative and resolve to deploy-prefixed URLs per the SPA router base alignment requirement above.

Examples in the SPA editor today (non-normative):

- Routed pages: Calendar, Library, Workout (new and edit).
- Meta modals: Settings, Help, Profile.
- In-flow picker dialogs: the calendar's empty-day "Add from Library" picker.

When a routed-page surface is reached, focus SHALL move deterministically to the page's primary heading on mount so keyboard and screen-reader users land in a predictable location, restoring the focus-management equity that the deleted header modal provided via Radix Dialog. The primary heading is the page's `<h1>` element marked with the route-heading attribute (`[data-route-heading]`); the attribute — not the element tag — is the contract. The element MUST be focusable via `tabIndex={-1}` and MUST suppress the default focus ring for non-keyboard activations (CSS `:focus:not(:focus-visible)`) so route-driven focus moves are silent visually but remain announced by assistive technology.

A live-announcer region in the SPA shell SHALL announce route changes to assistive technology with a human-readable label. The region SHALL use `aria-live="polite"` so navigation announcements do not interrupt other content, and `aria-atomic="true"` so each label change is read as a single unit (not diffed). Pure query-string changes that do not change the pathname SHALL NOT re-announce.

A CI guard script SHALL enforce the no-dual-mount invariant by allowlisting which files may import the Library content component, so a future PR cannot silently restore a header-summoned Library modal. The allowlist is maintained in the guard script and SHALL include only the page surface and the in-flow picker dialog.

#### Scenario: Library is classified as a routed page

- **WHEN** the user clicks the "Library" button in the desktop or mobile navigation header
- **THEN** the SPA SHALL navigate to the base-relative URL `/library`, the page surface SHALL render, focus SHALL land on the page's `[data-route-heading]` element, and no modal dialog SHALL mount as a result of the click

#### Scenario: Settings, Help, and Profile are classified as meta modals

- **WHEN** the user clicks Settings, Help, or Profile in the navigation header
- **THEN** the corresponding modal dialog SHALL open over the current route, the URL SHALL NOT change, the user's underlying route context (calendar, library, or workout editor) SHALL remain visible behind the modal so closing it returns the user to their work, and on close focus SHALL return to the triggering header button

#### Scenario: Calendar in-flow template selection uses a narrow picker dialog

- **WHEN** the user opens the empty-day dialog on a calendar cell and clicks "Add from Library"
- **THEN** the SPA SHALL open the template picker dialog with the cell's date supplied as a prop, the dialog's accessible name SHALL include the human-readable date (e.g. "Pick a template for Monday, May 4"), the dialog SHALL show a search-only template list (no delete or edit affordances), the URL SHALL NOT navigate away from the calendar route, and on selection the picker SHALL schedule the chosen template for that exact date — without showing any additional date-confirmation dialog — then close itself

#### Scenario: Browser back button closes an open in-flow picker without losing the parent route

- **WHEN** the user is on a routed page (e.g. `/calendar/2026-W18`) with an in-flow picker dialog open and presses the browser back button (or the equivalent gesture on touch devices)
- **THEN** the picker SHALL close, the parent route SHALL remain mounted, and the URL SHALL NOT change away from the parent route. The parent route's history entry SHALL not be popped by the picker close

#### Scenario: No SPA surface mounts as both a routed page and a header-mounted modal

- **WHEN** the user clicks the header "Library" control on desktop or mobile
- **THEN** no modal dialog SHALL mount; the action SHALL navigate to the routed page only. Mechanically, a CI guard script SHALL fail the build if the Library content component is imported anywhere outside the page surface and the in-flow picker dialog allowlist

#### Scenario: Route change announces a single label

- **WHEN** the wouter pathname changes (e.g., user navigates from `/calendar` to `/library`)
- **THEN** the SPA shell's `aria-live="polite"` `aria-atomic="true"` region SHALL update once with a human-readable label of the new route ("Library", "Calendar", "New workout", "Edit workout") so assistive technology announces the navigation as a single unit

#### Scenario: Route change moves focus to the page heading

- **WHEN** the wouter pathname changes
- **THEN** focus SHALL move to the new page's `[data-route-heading]` element on mount, and the focus ring SHALL NOT be visually rendered when the navigation was triggered by a non-keyboard activation (CSS `:focus:not(:focus-visible)` rule)

#### Scenario: Pure query-string changes do not re-announce

- **WHEN** the URL changes only its query string (e.g. `?filter=running`) without changing the pathname
- **THEN** the announcer label SHALL NOT change and focus SHALL NOT move; assistive technology SHALL receive no announcement about the change

#### Scenario: Initial mount announces the current route

- **WHEN** the SPA loads for the first time at any route (including a deep-linked `/library` or `/workout/:id`)
- **THEN** the announcer region SHALL emit one announcement matching the loaded route's label, so assistive technology hears the page identity on first load. The page heading text and the announcer label SHOULD be sufficiently distinct (e.g. heading "Library", announcer "Library page") to avoid duplicate reads

### Requirement: Health Hub routes are routed pages with primary heading focus and live-announcement

The five `/health/*` routes SHALL each remain classified as routed pages per the existing SPA surface classification requirement — owning a base-relative URL, supporting browser history, deep-linking and bookmarking, and rendering a single `[data-route-heading]` element focused on mount — but they SHALL NOT be reached via a primary navigation tab (that surface is removed). Discovery SHALL instead be:

- **Per-metric pages** (`/health/sleep`, `/health/weight`, `/health/recovery`, `/health/activity`) reached by clicking a wellness badge in a calendar day cell (per the "Calendar day cells surface per-day wellness" requirement) or from the trends hub. These remain history/detail views and their content is unchanged.
- **`/health`** rebuilt as the **wellness trends hub** (per the "Wellness trends hub is reachable from the header" requirement), reached from a header entry rather than a tab.

Each route SHALL continue to emit exactly one live-announcer label change on navigation (`"Sleep"`, `"Weight"`, `"Recovery"`, `"Activity"`, and a label for the trends hub) and SHALL move focus to its `[data-route-heading]` on mount, suppressing the visible focus ring for non-keyboard activations. No `/health/*` content component SHALL be mounted from more than one surface (the existing no-dual-mount invariant); the calendar wellness band links by URL and does not import health page content components.

#### Scenario: Health detail page is reached from a calendar badge, not a tab

- **WHEN** the user clicks the sleep badge in a calendar day cell
- **THEN** the SPA navigates to the base-relative URL `/health/sleep`, the sleep history page renders, focus lands on its `[data-route-heading]`, the announcer emits `"Sleep"` once, and no primary navigation tab bar is present in the layout

#### Scenario: Health detail deep-links survive refresh

- **WHEN** the user navigates directly to `/health/weight` via a bookmark and the static host returns 404 with the rafgraph fallback per the existing deep-link scenario
- **THEN** the rafgraph fallback restores the URL pre-mount, the router strips the configured base, the weight page re-renders, and the announcer emits `"Weight"` exactly once

#### Scenario: Health content components do not dual-mount

- **WHEN** a contributor attempts to mount a `/health/*` page content component from a non-route surface (header dropdown, modal, the calendar wellness band)
- **THEN** the CI guard SHALL fail the build per the R-LibraryNoDualMount-style enforcement; the calendar wellness band SHALL satisfy this by navigating via URL only, never importing a health page content component

#### Scenario: Pure query-string changes within a health route do not re-announce

- **WHEN** the user changes a range filter on `/health/weight?range=30d` to `?range=90d`
- **THEN** the announcer label SHALL NOT change and focus SHALL NOT move, per the existing query-string scenario

### Requirement: Calendar day cells surface per-day wellness with explicit training/wellness differentiation

Each calendar day cell (`DayColumn`) SHALL render a per-day **wellness band** above its training cards when the active profile has any wellness record for that date. The band SHALL be visually differentiated from training: a muted/neutral palette separated from the brand-coloured training cards by a divider, so training and wellness are explicitly distinguishable at a glance.

The band SHALL show a compact badge only for the metrics **present that day**, among: **sleep** (score or duration), **HRV/recovery** (rMSSD), **weight** (kg), and **steps/daily-activity**. Body composition and stress are NOT inline badges. When a day has no wellness records, the band SHALL be omitted entirely and the cell SHALL look identical to a training-only cell (including the `+ Add` affordance, which remains gated on the training bucket count only — independent of wellness presence).

Each badge SHALL be an independently activatable link/button with an accessible label, navigating to the corresponding per-metric page via a badge-name→route map `WELLNESS_BADGE_ROUTES` co-located with the band component (distinct from the `FileType`-keyed `health-destination.ts` import map): sleep → `/health/sleep`, weight → `/health/weight`, HRV → `/health/recovery`, steps → `/health/activity`.

The visible week's wellness SHALL be read through a single `useLiveQuery` keyed by `(profileId, weekStart..weekEnd)` returning a per-day map, threaded down the calendar component chain. A single query is used for **atomicity** — a day's badges resolve in one loading transition and never appear one at a time — not to satisfy a query-count rule. The map's contract SHALL distinguish three states: `undefined` = the week's wellness is still loading; an absent day key = no wellness that day; a present day key always carries ≥1 metric. The band SHALL NOT intercept the grid's drag-to-reschedule pointer handlers.

#### Scenario: A day with recorded wellness shows a differentiated band

- **GIVEN** the active profile has a sleep score, HRV, weight, and steps for Monday
- **WHEN** the calendar week containing Monday renders
- **THEN** Monday's cell shows a muted wellness band above the training cards with a badge for each of sleep, HRV, weight, and steps, and the training cards below remain brand-coloured and visually distinct

#### Scenario: Partial day shows only present metrics

- **GIVEN** Tuesday has only a weight measurement
- **WHEN** the week renders
- **THEN** Tuesday's band shows only the weight badge with no empty slots for the missing metrics

#### Scenario: Empty day shows no band

- **GIVEN** Wednesday has no wellness records and no training
- **WHEN** the week renders
- **THEN** Wednesday's cell shows no wellness band and still shows the `+ Add` training affordance

#### Scenario: Clicking a wellness badge drills down to its page

- **WHEN** the user clicks the sleep badge on a day cell
- **THEN** the SPA navigates to `/health/sleep`; clicking the weight badge instead navigates to `/health/weight`

#### Scenario: The wellness band does not break drag-to-reschedule

- **WHEN** the user drags a workout card to another day on a viewport ≥ 768px
- **THEN** the reschedule completes as before; pointer interactions on the wellness band do not start or capture a drag

#### Scenario: No band flicker while the week's wellness is loading

- **GIVEN** the calendar's training data has hydrated but the week's wellness query has not yet resolved (`wellnessByDay` is undefined)
- **WHEN** the calendar renders
- **THEN** every cell renders training-only with no wellness band and no placeholder, and bands appear in a single transition once wellness resolves — badges SHALL NOT pop in one metric at a time

#### Scenario: A dense day renders four badges without clipping

- **GIVEN** a day has sleep, HRV, weight, and steps recorded
- **WHEN** the cell renders in the narrowest supported column (≈140px on mobile)
- **THEN** all four badges are visible without overflow or clipping (wrapping or scrolling within the band), and the training cards below remain fully visible

### Requirement: Wellness trends hub is reachable from the header without a primary tab

The SPA header SHALL expose a **trends** entry (in `ENTRY_DEFS` / `StatusEntryButtons`), styled as a header entry button — NOT a primary navigation tab — that navigates to the `/health` route. The `/health` route SHALL render a **wellness trends hub**: a cross-metric view that lets the user select one or more metrics and a date range and renders the selected metrics as charts over that range. The hub replaces the prior 4-card launcher grid. It SHALL remain a routed page (heading focus, single announcer label) and read persisted data via the existing range live hooks.

#### Scenario: Header entry opens the trends hub

- **WHEN** the user activates the header trends entry from any route
- **THEN** the SPA navigates to `/health`, the trends hub renders with metric and date-range selectors, focus lands on its `[data-route-heading]`, and no primary navigation tab bar is present

#### Scenario: Selecting metrics and a range renders charts

- **GIVEN** the active profile has weight and HRV history over the last 90 days
- **WHEN** the user selects weight and HRV and a 90-day range in the trends hub
- **THEN** the hub renders a chart for each selected metric over that range

#### Scenario: Trends hub empty state

- **GIVEN** the active profile has no records for a selected metric in the chosen range
- **WHEN** the hub renders
- **THEN** it shows an empty-state message for that metric rather than an empty or broken chart
