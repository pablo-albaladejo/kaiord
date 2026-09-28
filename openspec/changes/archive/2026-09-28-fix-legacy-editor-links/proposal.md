> Completed: 2026-09-28

# Proposal: Stop linking the legacy /editor/ path, and serve it a 200 page

## Why

The 13 converter pages under `packages/docs/convert/` linked
`https://kaiord.com/editor/` 26 times. The editor moved to `/app/`; every
`/editor/*` URL now reaches it only through the redirect script that
`scripts/inject-spa-fallback.mjs` puts into `404.html`. Browsers follow it, but
crawlers and link checkers score the 404 status and stop, so the docs pointed
engines at a dead page, and `kaiord.com/editor/` (the URL five published
extensions and years of shared links carry) read as a 404.

Nothing could catch this: `lychee.toml` runs offline and excludes `https?://`,
so absolute `kaiord.com` links in the built site were never checked. Running
the new checker over the built site also found every docs breadcrumb (JSON-LD
`BreadcrumbList`) linking directory URLs that no page serves
(`/docs/api/core/type-aliases/`, `/docs/guide/quick-start/`, `/docs/index/`):
1,060 more 404 links handed to crawlers.

The specs still described the editor at `/editor/` (`landing-page` "SPA editor
served at /editor/ path", `branding` favicon and social-sharing scenarios).

## What Changes

- The 26 converter-page links point at `https://kaiord.com/app/`.
- New `scripts/emit-legacy-editor-page.mjs`, run in `deploy-site.yml` right
  after the bridge injector, writes `merged-dist/editor/index.html`: the same
  redirect expression as the bridge, `rel="canonical"` to
  `https://kaiord.com/app/`, a zero-delay meta refresh and a visible link. No
  `noindex`. It refuses to overwrite an existing file and to run before the
  bridge exists. `inject-spa-fallback.mjs` and `404.html` are not touched.
  A differential test runs both redirect scripts over one URL table and
  asserts identical targets; a mutation case proves it catches a dropped
  query string.
- New `scripts/check-site-links.mjs` resolves every absolute `kaiord.com` link
  in the built landing, SPA and docs (`*.html`, `*.md`, `llms*.txt`) the way
  GitHub Pages serves the merged tree, checks `/app/#/<segment>` against a new
  route registry `packages/workout-spa-editor/src/routing/route-segments.json`
  (kept in parity with `AppRoutes.tsx` by a test), and rejects `/editor` as a
  link target. It runs pre-merge in the CI `build` job ("Site guards") and in
  `deploy-site.yml` over the merged artifact.
- Docs breadcrumbs link only pages that exist: a crumb whose path has no page
  of its own is left out, and each crumb uses the page's canonical URL.
- `REQUIRE_DOCS_DIST=1` (set in the CI `build` job and in deploy) turns the
  "docs dist not built" skip of dist-reading docs tests into a failure.
- The deploy smoke also requires `/editor/` to answer 200 with the canonical.

## Impact

- Affected specs: `landing-page` (RENAMED "SPA editor served at /editor/
  path" to "SPA editor served at /app/ path", and MODIFIED), `branding` (MODIFIED "Favicon", "Open Graph meta tags"),
  `spa-routing` (MODIFIED "Legacy path URLs bridge into the fragment form",
  one scenario added).
- Clients without JavaScript land on `/app/` without the query string: a
  static meta refresh cannot append it. Only crawlers and no-JS agents take
  that path, and the canonical already points there.
- `/editor/<route>` paths are unchanged: they still go through `404.html`.
