## ADDED Requirements

### Requirement: SPA route location lives in the URL fragment

The `@kaiord/workout-spa-editor` SPA bootstrap (`packages/workout-spa-editor/src/main.tsx`) SHALL mount wouter with a fragment location hook rather than a `<Router base>` derived from the deploy prefix.

The requirement exists because the SPA is served by a static host that cannot rewrite. A route carried in the path can only answer 200 if a file exists at that path, and the SPA's routes include unbounded ones (`/workout/:id`, `/chat/:conversationId`) that cannot be generated at build time. Carrying the route in the fragment means the browser always requests the deploy prefix itself — a file that exists — so every route resolves in a single 200 response with no redirect and no error page painted on the way.

The fragment SHALL carry the **whole** route, query string included, and the router's `searchHook` SHALL read the query from the fragment. Wouter's own `useHashLocation` splits the two — path in the fragment, query in `location.search` — and its navigation writes the search only when the target restates one, so a query outlives the route that set it. The SPA reads `useSearch()` on eight surfaces, including a date; a query that survives a navigation is a wrong day rendered, not a cosmetic difference.

Vite's `base` continues to govern **asset** URLs; only the route leaves the path. Because the hook owns serialisation, `<Link>`, `navigate()`, `useLocation()` and `useSearch()` are unaffected at every call site.

#### Scenario: Wouter is mounted with the fragment hook

- **WHEN** `packages/workout-spa-editor/src/main.tsx` is parsed and rendered
- **THEN** the rendered tree SHALL include a wouter `<Router>` whose `hook` reads the location from the URL fragment, and SHALL NOT derive a router `base` from `import.meta.env.BASE_URL`

#### Scenario: A navigation drops a query it does not restate

- **WHEN** the app is at a route carrying a query (`/workout/new?date=2026-06-05`) and navigates to a route that states none (`/daily`)
- **THEN** `useSearch()` SHALL report an empty search, exactly as it would under browser-location routing

#### Scenario: A deep route answers 200 on the first request

- **WHEN** a cold request is made to a deep SPA URL on a Pages-equivalent host that returns 404 for unknown paths — including an unbounded route such as `/app/#/workout/<uuid>`
- **THEN** the host SHALL answer **200** for the requested path, the response SHALL be the SPA shell, and no error page SHALL be served or painted at any point

#### Scenario: Refreshing a deep route keeps the route

- **WHEN** the user refreshes while on a deep route
- **THEN** the address bar SHALL still read that route, the SPA SHALL render it, and exactly one document request SHALL have been made

#### Scenario: Analytics paths remain base-relative

- **WHEN** the SPA runs at its deploy prefix and the user navigates to the calendar route, triggering an analytics page-view
- **THEN** the analytics emitter SHALL have been invoked at least once with a base-relative path (`/calendar`), NOT with the deploy prefix and NOT with a fragment marker

#### Scenario: Garbage route resolves to the catch-all

- **WHEN** a malformed route is requested directly (cold)
- **THEN** the deploy prefix SHALL answer 200, the SPA's catch-all SHALL resolve, and the user SHALL land on the default route

### Requirement: Legacy path URLs bridge into the fragment form

URLs that carry the route in the path (`/editor/<route>`, and the narrow root-level allowlist) SHALL continue to reach the corresponding route, for as long as the site exists.

The bridge is deliberately open-ended rather than a deprecation window. Five published Chrome extensions carry `https://kaiord.com/editor/` in their popups, and their store updates are gated on a review outside this project's control; a bridge with a sunset would break them on a date nobody here chooses. Such URLs are served by the host's `404.html`, so they still cost one error response — what the change removes is the app ever _producing_ one.

The redirect script SHALL be injected into `<head>`, before any visible markup, so a legacy URL never paints an error page before it moves. `scripts/inject-spa-fallback.mjs` SHALL verify the snippet's **position**, not merely its presence: the appended-at-end placement is the state that produced a visible error page on every deep link while the presence check passed.

#### Scenario: A legacy path URL lands on the right route

- **WHEN** `/editor/calendar/2026-W32` is requested cold
- **THEN** the user SHALL end on the corresponding fragment route with the calendar week rendered

#### Scenario: The injector rejects an appended snippet

- **WHEN** the redirect snippet is appended after the document's visible markup instead of injected into `<head>`
- **THEN** `inject-spa-fallback` SHALL fail, naming the position rather than reporting the snippet as present

## REMOVED Requirements

### Requirement: SPA router base alignment with Vite deploy base

**Reason**: The router no longer derives its location from the deploy path, so aligning wouter's base with Vite's base has nothing left to align. Its scenarios encoded the 404 round-trip as the normal path for a deep refresh — "the static host SHALL serve the merged-dist `404.html`, the rafgraph fallback SHALL restore the URL" — which is the behaviour this change exists to remove. Asset URLs keep following Vite's `base`; that was never in question.

**Migration**: Deep routes are served through the fragment (see the modified requirement above). Path-form URLs already in the wild are covered by the legacy bridge, which retains the `404.html` round-trip for them alone.
