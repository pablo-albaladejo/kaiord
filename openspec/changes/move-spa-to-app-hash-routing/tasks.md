## 1. Router

- [ ] 1.1 Mount wouter with `useHashLocation` from `wouter/use-hash-location` at the single `<Router>` in `src/main.tsx`
- [ ] 1.2 Retire `computeRouterBase` from the router path and delete its unit test, or re-scope both to asset-base derivation if a consumer remains
- [ ] 1.3 Point `build-route-error-payload.ts` at the router's location instead of `window.location.pathname`, so a route error still names its route

## 2. Path rename

- [ ] 2.1 `VITE_BASE_PATH=/editor/` → `/app/` everywhere it is set (deploy workflow, e2e prod-base spec, any script)
- [ ] 2.2 `deploy-site.yml`: build the SPA into `merged-dist/app`, and update the artifact verification to assert `merged-dist/app/index.html`
- [ ] 2.3 Landing: the six `/editor/` links become `/app/`
- [ ] 2.4 The five bridge popups' `OPEN_EDITOR_URL` becomes `https://kaiord.com/app/`; store listings mention the new URL
- [ ] 2.5 `robots.txt` / `sitemap.xml` / OG metadata: check for a `/editor` reference and move it

## 3. Legacy bridge

- [ ] 3.1 `inject-spa-fallback.mjs`: inject the redirect into `<head>` with the `.replace(/<head>/…)` technique the decoder already uses, instead of appending
- [ ] 3.2 The redirect translates `/editor/<route>` and the root-level legacy allowlist into `/app/#/<route>`
- [ ] 3.3 Replace the presence check with a positional one: the snippet's index must precede the first visible markup, and the check must fail against the appended placement
- [ ] 3.4 The decoder in `app/index.html` keeps honouring `?p=` for links already in the wild, converting it into the hash

## 4. Specs and tests

- [ ] 4.1 Rewrite `spa-route-refresh.spec.ts` around the new contract: assert the first response is **200** and that no error markup is painted, not merely that the URL is restored
- [ ] 4.2 Add a case for a legacy `/editor/*` URL: it may bounce, and it must land on the right hash route
- [ ] 4.3 Sweep `goto()` calls across the e2e suite to the hash form
- [ ] 4.4 Update `openspec/specs/spa-routing/spec.md` via this change's delta

## 5. Verification

- [ ] 5.1 Unit + full chromium e2e green
- [ ] 5.2 Prod-base e2e (`E2E_PROD_BASE=1`) green against the merged artifact
- [ ] 5.3 After deploy, measure production directly: `/app/`, `/app/#/calendar/<week>` and a `/app/#/workout/<uuid>` all answer 200 with no intermediate request, and a legacy `/editor/*` still lands correctly
