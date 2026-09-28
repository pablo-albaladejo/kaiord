# Tasks

## 1. Docs indexing

- [x] 1.1 Add `.vitepress/indexing.mjs` (noindex predicate, git `lastmod`,
      shallow-clone rules) and its tests.
- [x] 1.2 `transformHead`: `noindex,follow` on API symbol pages;
      `dateModified` from `pageData.lastUpdated`.
- [x] 1.3 `sitemap.transformItems`: indexable pages only; API entry pages
      dated from their package sources.
- [x] 1.4 `srcExclude` the root `README.md` and `CHANGELOG.md`.
- [x] 1.5 `lastUpdated` with a visible "Last updated".
- [x] 1.6 Unique title and description on each TypeDoc package index.

## 2. Landing

- [x] 2.1 Generate `sitemap-landing.xml` at build with git `<lastmod>`;
      delete the static copy.
- [x] 2.2 EN and ES descriptions within 160 characters.

## 3. Guards and CI

- [x] 3.1 `dist-seo-uniqueness.test.mjs`, shown failing on the pre-change
      build.
- [x] 3.2 Landing `sitemap.test.ts` and `meta-length.test.ts`.
- [x] 3.3 CI `build` and deploy: `fetch-depth: 0` and
      `REQUIRE_FULL_HISTORY=1`; deploy runs the docs indexing guard.

## 4. Spec

- [x] 4.1 MODIFY `docs-site` and `landing-page` as listed in the proposal.
