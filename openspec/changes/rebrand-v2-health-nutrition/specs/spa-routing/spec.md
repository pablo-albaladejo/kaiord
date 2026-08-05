## MODIFIED Requirements

### Requirement: Health Hub routes are routed pages with primary heading focus and live-announcement

The six `/health/*` routes — `/health`, `/health/sleep`, `/health/weight`,
`/health/recovery`, `/health/activity` and `/health/labs` — SHALL each remain
classified as routed pages per the existing SPA surface classification
requirement, owning a base-relative URL, supporting browser history,
deep-linking and bookmarking, and rendering a single `[data-route-heading]`
element focused on mount. None of them SHALL be reached via a primary
navigation tab (that surface is removed). Discovery SHALL be:

- **A sub-route strip present on every `/health/*` page**, listing all six
  routes and marking the current one with `aria-current="page"`. No health
  route SHALL be absent from the strip: a route reachable only by typing its
  URL is not discoverable.
- **Per-metric pages** (`/health/sleep`, `/health/weight`, `/health/recovery`,
  `/health/activity`) additionally reached by clicking a wellness badge in a
  calendar day cell (per the "Calendar day cells surface per-day wellness"
  requirement). These remain history/detail views.
- **`/health`** as the **wellness trends hub** (per the "Wellness trends hub is
  reachable from the header" requirement), also reached from a header entry
  rather than a tab.

Each route SHALL continue to emit exactly one live-announcer label change on
navigation and SHALL move focus to its `[data-route-heading]` on mount,
suppressing the visible focus ring for non-keyboard activations. The strip
SHALL NOT introduce a second heading and SHALL NOT be announced as a route
change when it is re-rendered under a new route. No `/health/*` content
component SHALL be mounted from more than one surface (the existing
no-dual-mount invariant); the calendar wellness band and the strip both link by
URL and import no health page content component.

#### Scenario: Every health route is reachable from the strip

- **GIVEN** the user is on any `/health/*` page
- **WHEN** the sub-route strip is inspected
- **THEN** it SHALL expose exactly six links — the trends hub, sleep, recovery, weight, activity and labs — and the link matching the current pathname SHALL carry `aria-current="page"` while no other link does

#### Scenario: Health detail page is reached from a calendar badge, not a tab

- **WHEN** the user clicks the sleep badge in a calendar day cell
- **THEN** the SPA navigates to the base-relative URL `/health/sleep`, the sleep history page renders, focus lands on its `[data-route-heading]`, the announcer emits `"Sleep"` once, and no primary navigation tab bar is present in the layout

#### Scenario: Health detail deep-links survive refresh

- **WHEN** the user navigates directly to `/health/weight` via a bookmark and the static host returns 404 with the rafgraph fallback per the existing deep-link scenario
- **THEN** the rafgraph fallback restores the URL pre-mount, the router strips the configured base, the weight page re-renders, and the announcer emits `"Weight"` exactly once

#### Scenario: Health content components do not dual-mount

- **WHEN** a contributor attempts to mount a `/health/*` page content component from a non-route surface (header dropdown, modal, the calendar wellness band, the sub-route strip)
- **THEN** the CI guard SHALL fail the build per the R-LibraryNoDualMount-style enforcement; the calendar wellness band and the sub-route strip SHALL satisfy this by navigating via URL only, never importing a health page content component

#### Scenario: Pure query-string changes within a health route do not re-announce

- **WHEN** the user changes a range filter on `/health/weight?range=30d` to `?range=90d`
- **THEN** the announcer label SHALL NOT change and focus SHALL NOT move, per the existing query-string scenario
