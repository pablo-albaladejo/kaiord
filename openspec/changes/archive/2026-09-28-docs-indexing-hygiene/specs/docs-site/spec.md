## MODIFIED Requirements

### Requirement: Per-page SEO

Every documentation page SHALL include a `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image`, and `<link rel="canonical">` via VitePress frontmatter and the `transformHead` hook. The `<html>` element SHALL include `lang="en"`. TypeDoc symbol pages (`/docs/api/<pkg>/<kind>/<symbol>`) SHALL carry `<meta name="robots" content="noindex,follow">`; the API root (`/docs/api/`) and each package index (`api/<pkg>/README`, or `api/<pkg>/` for placeholders) SHALL stay indexable, and the package indexes SHALL have a title and description of their own. Title and description SHALL be unique across the indexable pages. The package `README.md` and `CHANGELOG.md` at the docs root SHALL NOT be built as pages. Noindex pages SHALL stay linked and in `llms-full.txt`.

#### Scenario: Meta tags present

- **WHEN** any indexable doc page is rendered
- **THEN** it SHALL have a title and meta description no other indexable page shares, and per-page OG title/description — not generic or empty

#### Scenario: API symbol pages are noindex

- **WHEN** a TypeDoc symbol page such as `/docs/api/core/functions/fromBinary` is rendered
- **THEN** it SHALL carry `<meta name="robots" content="noindex,follow">`, and `/docs/api/core/README` SHALL NOT

#### Scenario: Package files are not pages

- **WHEN** the docs are built
- **THEN** `/docs/README` and `/docs/CHANGELOG` SHALL NOT exist

#### Scenario: Lang attribute

- **WHEN** any doc page is rendered
- **THEN** the `<html>` element SHALL include `lang="en"`

#### Scenario: Guarded over the build

- **WHEN** `packages/docs/scripts/dist-seo-uniqueness.test.mjs` runs with `REQUIRE_DOCS_DIST=1` (CI `build` job and deploy)
- **THEN** it SHALL fail if a page's `noindex` disagrees with the predicate, or two indexable pages share a title or description

### Requirement: Auto-generated sitemap

VitePress SHALL generate `sitemap.xml` through its built-in `sitemap` config, filtered by `sitemap.transformItems` with the same predicate `transformHead` uses, so it lists exactly the indexable pages. Each entry SHALL carry a `<lastmod>` from git: VitePress `lastUpdated` for hand-written pages, and the last commit touching `packages/<pkg>/src` for the generated API entry pages. In a shallow clone the dates SHALL be omitted, and with `REQUIRE_FULL_HISTORY=1` the build SHALL fail instead. The root sitemap index references it at deploy time.

#### Scenario: All doc pages in sitemap

- **WHEN** the sitemap is generated
- **THEN** every indexable doc page (guides, formats, converters, CLI, MCP, legal, the API root and package indexes) SHALL have an entry, and no `noindex` page SHALL

#### Scenario: Sitemap dated from git

- **WHEN** the docs are built from a full-history checkout with `REQUIRE_FULL_HISTORY=1`
- **THEN** every `<url>` SHALL have a `<lastmod>`, and the dates SHALL NOT all be identical

## ADDED Requirements

### Requirement: Last updated date

Doc pages SHALL show a visible "Last updated" date taken from git, and the TechArticle JSON-LD SHALL carry `dateModified` with the same date. When no date is known (a generated page, or a shallow clone) both SHALL be omitted rather than guessed.

#### Scenario: Date shown and structured

- **WHEN** a hand-written doc page such as `/docs/guide/quick-start` is rendered from a full-history build
- **THEN** it SHALL show "Last updated" and its TechArticle SHALL include `dateModified`
