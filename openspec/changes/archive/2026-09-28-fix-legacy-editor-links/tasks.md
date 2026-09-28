# Tasks

## 1. Content

- [x] 1.1 Point the 26 `kaiord.com/editor/` links in the 13
      `packages/docs/convert/*.md` pages at `https://kaiord.com/app/`.
- [x] 1.2 Make docs breadcrumbs link only pages that exist.

## 2. Legacy /editor/ page

- [x] 2.1 Add `scripts/emit-legacy-editor-page.mjs` (canonical, redirect, meta
      refresh, no `noindex`; refuses to overwrite or to run without the
      bridge).
- [x] 2.2 Differential test against the real injector output, with a mutation
      case that drops `l.search`.
- [x] 2.3 Run it in `deploy-site.yml` after the injector; smoke `/editor/` for
      200 + canonical.
- [x] 2.4 Leave `scripts/inject-spa-fallback.mjs` and
      `packages/landing/public/404.html` untouched.

## 3. Guards

- [x] 3.1 Add `route-segments.json` and its parity test against
      `AppRoutes.tsx`.
- [x] 3.2 Add `scripts/check-site-links.mjs` with fixtures, and run it against
      the pre-fix build first to see it fail.
- [x] 3.3 CI `build` job: "Site guards" step with `REQUIRE_DOCS_DIST=1`.
- [x] 3.4 Dist-reading docs tests fail instead of skipping under
      `REQUIRE_DOCS_DIST=1`.

## 4. Spec

- [x] 4.1 MODIFY `landing-page`, `branding` and `spa-routing` as listed in the
      proposal.
