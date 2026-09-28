> Completed: 2026-09-28

# Proposal: Index only the docs pages worth indexing, and date them from git

## Why

`kaiord.com/docs/sitemap.xml` listed 374 URLs; 344 were TypeDoc symbol
pages (`/docs/api/<pkg>/{functions,type-aliases,variables,classes}/…`).
Google Search Console indexes 37 of 377 docs URLs and drops the rest, so the
sitemap spent the crawl budget on pages the engine had already rejected. The
symbol pages also shared one meta description (the site default), and five
pairs shared a title (`ListOptions`, `PushResult`, … exist in both `core`
and `garmin-connect`).

The package `README.md` and `CHANGELOG.md` at the docs root were built as
pages (`/docs/README`, `/docs/CHANGELOG`) with the same title and the site
description, and listed in the sitemap.

No sitemap entry had a `<lastmod>`: the docs sitemap never enabled
`lastUpdated`, and `sitemap-landing.xml` was a static file in `public/`.
Nothing showed readers or engines when a page last changed (no "Last
updated", no `dateModified`).

The landing meta descriptions were 231 (EN) and 295 (ES) characters, so
search results cut them mid-sentence.

## What Changes

- New `packages/docs/.vitepress/indexing.mjs`: one predicate
  (`isNoindexPath`/`isNoindexUrl`) feeds both `transformHead` and
  `sitemap.transformItems`. API symbol pages get
  `<meta name="robots" content="noindex,follow">` and leave the sitemap;
  `api/` and each package index stay indexable. Every page stays linked and
  in `llms-full.txt`.
- `srcExclude` adds the root-anchored `README.md` and `CHANGELOG.md`
  (`api/<pkg>/README.md` stays).
- `lastUpdated` on: VitePress dates tracked pages from git, shows "Last
  updated", and the TechArticle JSON-LD carries `dateModified`. The
  generated API entry pages are dated from `packages/<pkg>/src`.
- Shallow clones (depth 1 answers HEAD's date for every path) are detected
  with `git rev-parse --is-shallow-repository`: dates are left out, and
  `REQUIRE_FULL_HISTORY=1` turns that into an error. The CI `build` job and
  `deploy-site.yml` check out with `fetch-depth: 0` and set it. The other
  workflows that build the site (`eval`, `metrics-gate`, the e2e and
  visual-baseline workflows) stay shallow and build without dates.
- The TypeDoc package indexes get a unique title and description from the
  generator.
- New `packages/landing/scripts/build-sitemap.mjs` generates
  `dist/sitemap-landing.xml` at build with a git `<lastmod>` per URL; the
  static `public/sitemap-landing.xml` is deleted.
- Landing descriptions: EN 153 and ES 158 characters.
- Guards: `packages/docs/scripts/dist-seo-uniqueness.test.mjs` (over the
  built dist: noindex matches the predicate, unique titles and descriptions
  across indexable pages, sitemap ⇄ indexable pages, and with
  `REQUIRE_FULL_HISTORY=1` every entry dated and the dates not all equal),
  `indexing.test.mjs`, and the landing `sitemap.test.ts` and
  `meta-length.test.ts`. A docs breadcrumb labels the `api` crumb "API".

## Impact

- Affected specs: `docs-site` (MODIFIED "Per-page SEO" and "Auto-generated
  sitemap"; ADDED "Last updated date"), `landing-page` (MODIFIED "SEO
  fundamentals"; ADDED "Meta descriptions fit search snippets").
- The docs sitemap drops from 374 to 37 URLs. The SEO observatory's
  "indexed / submitted" ratio changes denominator accordingly.
- The CI `build` job and deploy fetch the full history.
