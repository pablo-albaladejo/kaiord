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
