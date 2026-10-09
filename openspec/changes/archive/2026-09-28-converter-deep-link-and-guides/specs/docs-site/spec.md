## MODIFIED Requirements

### Requirement: Manual guides

The docs site SHALL include manually written guides migrated from existing documentation: Getting Started, Architecture, KRD Format, Testing, and Contributing. It SHALL also include three guides for athletes, listed in a "For athletes" sidebar group: AI planning with your own API key (`guide/ai-planning-byok`), WHOOP recovery in the training plan (`guide/whoop-recovery-in-plan`), and a comparison with TrainingPeaks, intervals.icu and Garmin Connect (`guide/kaiord-vs-trainingpeaks-intervals-garmin`). The comparison SHALL date its table ("as of <date>"), SHALL cite a source for every claim about another product, and SHALL write "Not compared" for a fact it cannot source. An editorial placeholder (`CONFIRMAR`) SHALL never ship: the dist test fails if one remains in a built page, its `.md` mirror or `llms-full.txt`. Claims about Kaiord in these guides SHALL match the code. The Zwift-to-Garmin guide is deferred until the Garmin writer converts % FTP power targets to watts (issue #1279); until then the ZWO/FIT to Garmin converter pages SHALL state that known issue.

#### Scenario: Guide content accessible

- **WHEN** a user navigates to `/docs/guide/getting-started`
- **THEN** the Getting Started guide SHALL be displayed with installation instructions and basic usage examples

#### Scenario: Athlete guide accessible

- **WHEN** a user navigates to `/docs/guide/ai-planning-byok`
- **THEN** the guide SHALL be displayed and SHALL link the Spanish version at `/docs/es/guide/ai-planning-byok`

#### Scenario: Comparison claims are sourced

- **WHEN** a reader opens `/docs/guide/kaiord-vs-trainingpeaks-intervals-garmin`
- **THEN** the table SHALL carry its "as of" date and every claim about another product SHALL carry a footnote to its source

### Requirement: Per-page SEO

Every documentation page SHALL include a `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image`, and `<link rel="canonical">` via VitePress frontmatter and the `transformHead` hook. The `<html>` element SHALL include `lang="en"`, except pages under `/docs/es/`, which SHALL include `lang="es"` (see "ES locale for guides with hreflang"). TypeDoc symbol pages (`/docs/api/<pkg>/<kind>/<symbol>`) SHALL carry `<meta name="robots" content="noindex,follow">`; the API root (`/docs/api/`) and each package index (`api/<pkg>/README`, or `api/<pkg>/` for placeholders) SHALL stay indexable, and the package indexes SHALL have a title and description of their own. Title and description SHALL be unique across the indexable pages. The package `README.md` and `CHANGELOG.md` at the docs root SHALL NOT be built as pages. Noindex pages SHALL stay linked and in `llms-full.txt`.

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

- **WHEN** any doc page outside `/docs/es/` is rendered
- **THEN** the `<html>` element SHALL include `lang="en"`

#### Scenario: Guarded over the build

- **WHEN** `packages/docs/scripts/dist-seo-uniqueness.test.mjs` runs with `REQUIRE_DOCS_DIST=1` (CI `build` job and deploy)
- **THEN** it SHALL fail if a page's `noindex` disagrees with the predicate, or two indexable pages share a title or description

## ADDED Requirements

### Requirement: ES locale for guides with hreflang

The docs site SHALL publish the three athlete guides in Spanish under `/docs/es/guide/<slug>`, with a Spanish landing at `/docs/es/`. Every other page stays English only, with `<html lang="en">`; Spanish pages SHALL have `<html lang="es">`. The language switcher SHALL link each locale's root (`i18nRouting: false`), never `/es/<same path>` of an untranslated page. Each page of an EN/ES pair SHALL carry `<link rel="alternate" hreflang>` for `en`, `es` and `x-default` (the English page), taken from one pair map, and no other page SHALL carry hreflang. The sitemap SHALL list both pages of each pair. Spanish pages SHALL be spell-checked with a Spanish dictionary.

#### Scenario: Paired pages declare their alternates

- **WHEN** `/docs/es/guide/whoop-recovery-in-plan` is built
- **THEN** it has `<html lang="es">` and hreflang links to `/docs/guide/whoop-recovery-in-plan` (`en`, `x-default`) and to itself (`es`)

#### Scenario: Switcher never links a missing page

- **WHEN** any built docs page renders the language switcher
- **THEN** every switcher link resolves to a built page, and `check-site-links` fails the build otherwise

#### Scenario: Every docs page renders the switcher

- **WHEN** `check-site-links` runs with `REQUIRE_DOCS_DIST=1` on the docs build
- **THEN** it fails if any docs page other than `404.html` renders no language-switcher link

#### Scenario: Untranslated pages stay English

- **WHEN** `/docs/guide/quick-start` is built
- **THEN** it has `<html lang="en">` and no hreflang link
