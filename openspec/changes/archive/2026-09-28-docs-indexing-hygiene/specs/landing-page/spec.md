## MODIFIED Requirements

### Requirement: SEO fundamentals

The landing page SHALL include: `robots.txt` (allow everything, `/docs/` and the legacy `/editor/` included: `/editor/` SHALL stay crawlable so engines read its canonical to `/app/`), a root `sitemap.xml` sitemap index referencing `/sitemap-landing.xml` and `/docs/sitemap.xml`, `<link rel="canonical">` pointing to `https://kaiord.com/`, and JSON-LD structured data (`@type: SoftwareSourceCode` with name, description, url, programmingLanguage, license, codeRepository, and `author` with `@type: Person`, name "Pablo Albaladejo", and sameAs linking to LinkedIn and GitHub profiles). `sitemap-landing.xml` SHALL be generated at build time (not kept as a static file), listing `/`, `/es/` and `/app/`, each with a `<lastmod>` equal to the date of the last commit touching the files that page is built from. In a shallow clone the `<lastmod>` elements SHALL be omitted, and with `REQUIRE_FULL_HISTORY=1` the build SHALL fail instead.

#### Scenario: Search engine crawl

- **WHEN** a search engine crawls `kaiord.com`
- **THEN** `robots.txt` SHALL be accessible at `/robots.txt`, `sitemap.xml` at `/sitemap.xml`, and structured data SHALL be valid per Google Rich Results Test

#### Scenario: Docs crawlable

- **WHEN** a search engine crawls `kaiord.com/robots.txt`
- **THEN** `/docs/` SHALL be allowed (not disallowed)

#### Scenario: Docs in sitemap

- **WHEN** a search engine reads `kaiord.com/sitemap.xml`
- **THEN** documentation URLs SHALL be included

#### Scenario: Landing sitemap dated from git

- **WHEN** the landing is built from a full-history checkout
- **THEN** every `<url>` in `sitemap-landing.xml` SHALL carry the `<lastmod>` of the last commit touching its sources

#### Scenario: Shallow clone

- **WHEN** the landing is built from a shallow clone
- **THEN** `sitemap-landing.xml` SHALL carry no `<lastmod>`, unless `REQUIRE_FULL_HISTORY=1` is set, in which case the build SHALL fail

## ADDED Requirements

### Requirement: Meta descriptions fit search snippets

The EN (`index.html`) and ES (`i18n/meta.json`) meta descriptions, including their Open Graph and Twitter copies, SHALL each be at most 160 characters, and the EN and ES pages SHALL have different titles and descriptions.

#### Scenario: Description length

- **WHEN** the landing tests run
- **THEN** every EN and ES description SHALL be non-empty and at most 160 characters
