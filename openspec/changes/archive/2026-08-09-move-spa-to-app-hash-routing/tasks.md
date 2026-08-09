## 1. Router

- [x] 1.1 Mount wouter with a fragment location hook at the single `<Router>` in `src/main.tsx`
- [x] 1.2 Retire `computeRouterBase` from the router path and delete its unit test, or re-scope both to asset-base derivation if a consumer remains
- [x] 1.3 Point `build-route-error-payload.ts` at the router's location instead of `window.location.pathname`, so a route error still names its route
- [x] 1.4 Carry the query inside the fragment and supply the matching `searchHook`: wouter's own hash hook leaves the query in `location.search` and only rewrites it when the target restates one, so a `?date=` outlives the route that set it

## 2. Path rename

- [x] 2.1 `VITE_BASE_PATH=/editor/` → `/app/` everywhere it is set (deploy workflow, e2e prod-base spec, any script)
- [x] 2.2 `deploy-site.yml`: build the SPA into `merged-dist/app`, and update the artifact verification to assert `merged-dist/app/index.html`
- [x] 2.3 Landing: the six `/editor/` links become `/app/`
- [x] 2.4 The five bridge popups' `OPEN_EDITOR_URL` becomes `https://kaiord.com/app/`; store listings mention the new URL
- [x] 2.5 `robots.txt` / `sitemap.xml` / OG metadata: check for a `/editor` reference and move it (sitemap and `llms.txt` carried one; `robots.txt` did not)

## 3. Legacy bridge

- [x] 3.1 `inject-spa-fallback.mjs`: inject the redirect into `<head>` with the `.replace(/<head>/…)` technique the decoder already uses, instead of appending
- [x] 3.2 The redirect translates `/editor/<route>` and the root-level legacy allowlist into `/app/#/<route>`
- [x] 3.3 Replace the presence check with a positional one: the snippet's index must precede the first visible markup, and the check must fail against the appended placement
- [x] 3.4 The decoder in `app/index.html` keeps honouring `?p=` for links already in the wild, converting it into the hash

## 4. Specs and tests

- [x] 4.1 Rewrite `spa-route-refresh.spec.ts` around the new contract: assert the first response is **200** and that no error markup is painted, not merely that the URL is restored
- [x] 4.2 Add a case for a legacy `/editor/*` URL: it may bounce, and it must land on the right hash route
- [x] 4.3 Sweep `goto()` calls across the e2e suite to the hash form — done in the fixture, the single point that translates a route into a URL; the five specs that imported `test` from `@playwright/test` directly moved onto it
- [x] 4.4 Update `openspec/specs/spa-routing/spec.md` via this change's delta

## 5. Verification

- [x] 5.1 Unit + full chromium e2e green — unit 6488 and Chromium 302 green. Locally the six-project matrix ran 1700 passed; on `main`, CI's cross-browser workflow runs **five** projects (Chromium, firefox 284, webkit, Mobile Chrome, Mobile Safari), all green. The sixth, `Mobile-768`, is defined in the config but run by no CI job — tracked in #1162
- [x] 5.2 Prod-base e2e (`E2E_PROD_BASE=1`) green against the merged artifact — 11/11, and red-proven: reverting the router turns 9 of the 10 red
- [x] 5.3 After deploy, measure production directly: `/app/`, `/app/#/calendar/<week>` and a `/app/#/workout/<uuid>` all answer 200 with no intermediate request, and a legacy `/editor/*` still lands correctly — 5/5 in a real browser. The four fragment-route checks (`/app/`, a calendar week, a workout UUID, and a route carrying a query) each recorded **exactly one document response, status 200**. The fifth is the legacy bridge, which by design records two — `[404, 200]` — and lands on the right fragment route; that bounce is the one cost the change does not remove and cannot, since the host has no file at the legacy path. The redirect script sits at byte 110 of the served `404.html`, with `<body` at 3166 (it was at 3208, behind a `</body>` that closed at 3161)
