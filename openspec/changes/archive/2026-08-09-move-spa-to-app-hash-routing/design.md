## Context

The SPA is served by GitHub Pages from a merged artifact: the landing at the root, the SPA under a prefix, VitePress under `/docs`. Pages resolves a request to a file or answers 404 with the root `404.html`; it cannot rewrite. Everything below follows from that.

## What was measured before deciding

- Deep SPA URLs answer 404 (`/editor/calendar/2026-W32`, `/editor/library`); `/editor/` answers 200.
- The redirect script sits at byte 3208 of the served `404.html`; `</body>` closes at 3161 and the visible text starts at 2963. The paint precedes the redirect by construction.
- Pages ignores a per-directory `404.html`: `/docs/pagina-que-no-existe` returns the root `404.html` byte-for-byte (same sha) even though `/docs/404.html` exists and is 26 KB.
- The landing and the docs already answer 200 on their own routes; `/es` answers 301. Only the SPA has the problem.
- Umami is loaded with `data-auto-track="false"` and page views are submitted with the wouter path.
- Bridge manifests match `https://*.kaiord.com/*`, with no path segment.

## Options considered

**Pre-generate a file per route.** Turns bounded routes into real 200s, and cannot cover `/workout/:id` or `/chat/:conversationId`. Half a solution to a requirement that is about never seeing a 404, so it fails on the cases most likely to be shared.

**Make `404.html` be the SPA shell.** Removes the second round trip and the flash: a deep URL renders the app immediately. The status stays 404, and one file has to serve both the app and the landing's genuine error page. Rejected: the requirement is about the status, and the dual-purpose file is the kind of cleverness that decays.

**Move the origin behind CloudFront.** Restores a real 200 at a real path with no `#`, and is the architecture already running for `pabloalbaladejo.com` (CDK, S3 + OAC, viewer-request function). Rejected _for now_ on scope, not on merit: it replaces the deploy pipeline and puts the domain behind infrastructure with nothing behind it if the distribution fails. The viewer-request function written while exploring this option is parked on `feat/cloudfront-s3-origin`, with tests proving a naive editor-only rewrite would have taken the docs and both landings down.

**Hash location.** The path is always `/app/`, a file that exists, so the first response is 200 for every route including the unbounded ones. Chosen: it satisfies the requirement completely, needs no infrastructure, and the router already supports it.

## Decisions

**A fragment location hook replaces the base prop.** `<Router hook={useFragmentLocation}>` at the single mount point in `main.tsx`. Every `<Link>`, `navigate()` and `useLocation()` keeps working untouched because the hook owns serialisation. `computeRouterBase` loses its reason to exist in the router path — the deploy prefix still governs _asset_ URLs through Vite's `base`, but no longer the route.

**The hook is written here rather than imported from wouter.** The first implementation used wouter's `useHashLocation`; the full e2e suite went from green to ~60 failures in one run. Wouter splits a route across two parts of the URL — path in the fragment, query in `location.search` — and its `navigate` writes the search only `if (search)`, i.e. only when the target restates one. So `/workout/new?date=2026-06-05` → `/daily` arrives as `/app/?date=2026-06-05#/daily`, and `use-today-route-params` renders the stale date. Eight SPA surfaces read `useSearch()`. Our hook puts the whole route in the fragment and supplies the matching `searchHook`, which restores the browser-location semantics the app was written against and, incidentally, keeps every `waitForURL(/\/workout\/new\?date=…/)` in the suite meaningful.

Worth naming, because it recurs: the first version passed the unit tests and all six production-base scenarios. Not one of them used a query string. The check was not wrong, it was narrow — and a suite that only exercises the shapes you thought of certifies the shapes you thought of.

**The legacy bridge has no end date.** Five published extensions carry `https://kaiord.com/editor/` in their popups, and their store updates are blocked on a review that has been pending since 18 July. A bridge with a sunset would break them on a date we do not control, so `/editor/*` keeps translating into the new hash form for as long as the site exists. It is cheap: one script in a file Pages already serves.

**The injector's check changes shape.** It currently asserts the snippet is present. Present-at-the-end is precisely the state that produced the reported bug, so the check becomes positional: the script must precede the first visible markup. A check that cannot distinguish the working state from the broken one is not a check.

**`/app` over a product name.** Short, honest, does not collide with `/docs`, and does not promise a product shape that a later rename would have to undo. `/app` currently answers the landing's 404, so the path is free.

## Risks

- **Old links keep their 404.** A bookmark to `/editor/calendar/X` still bounces, because Pages cannot do otherwise. What changes is that the app stops producing such URLs, so the population shrinks instead of growing.
- **Anything reading `location.pathname` sees only `/app/`.** One site does: `build-route-error-payload.ts`, which reports the route on a route error. It moves to the router's own location, or the reports lose the very field they exist for.
- **The e2e suite navigates by path in many specs.** ~180 call sites. Rather than edit each one, the base fixture became the single place that spells a route as a URL, and the five specs that imported `test` straight from `@playwright/test` moved onto it (gaining the WebKit retry they had been missing). What the fixture cannot cover is the handful of assertions that read the address bar themselves: one `waitForURL` predicate on `url.pathname`, which under fragment routing never moves and so waited out its timeout, and the `health-routes` pathname assertion.

- **`goto` had to keep meaning "load from scratch".** With the route in the fragment, a second `goto` in the same test is a same-document navigation: the app keeps running and merely re-routes, so a spec that seeds Dexie and then navigates no longer gets the fresh mount it was written for. The fixture blanks the document first. Reloading instead would boot the app at the new route and immediately tear it down — the second-navigation-racing-the-mount shape that `helpers/seed-empty-workout` records as the dominant WebKit flake, and which showed up as one on the first full run.
