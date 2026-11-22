## ADDED Requirements

### Requirement: HTML pages, translation files and README intros are readable surfaces

`scripts/check-claims.mjs` SHALL read, besides Markdown and named locale keys:
an HTML page, whose units are its text nodes, its `aria-label`, `alt` and
`title` values, its `<title>`, and the content of its `description`, `og:*`
and `twitter:*` text metas, with entities decoded, scripts, styles and
comments dropped, and each `<pre>` as one unit; a JSON file with no `keys`,
whose units are all its string values and never its object keys; a dotted
key into a nested JSON file; and the `intro` of a Markdown file, its H1 and
everything before its first sub-heading. A unit SHALL hold a letter or a
digit.

#### Scenario: A sentence is added to the landing

- **WHEN** a paragraph, an `aria-label` or a meta description with no register entry is added to `packages/landing/index.html`
- **THEN** `pnpm lint:claims` SHALL fail and quote it

#### Scenario: A translation changes

- **WHEN** a Spanish value in `packages/landing/i18n/es.json` changes and its entry does not
- **THEN** `pnpm lint:claims` SHALL fail on the new text and on the stale entry

#### Scenario: A number is a claim

- **WHEN** a stat card shows a lone count such as "5"
- **THEN** that count SHALL be a unit that needs an entry and a proof

### Requirement: The landing and the READMEs are registered

`claims/landing.json` SHALL register `packages/landing/index.html`,
`packages/landing/partials/phone-screen.html`, `packages/landing/i18n/es.json`
and the Spanish title and descriptions of `packages/landing/i18n/meta.json`.
`claims/readme.json` SHALL register the root `README.md` (intro, Features,
Local-first architecture) and the intro of the README of every published
package that has one. Their text SHALL name the products Kaiord SDK and
Kaiord App as `GLOSSARY.md` defines them, describe KRD as the SDK's internal
canonical model, and SHALL NOT call any conversion lossless or round-trip
safe until a Round-trip test proves it for that format.

#### Scenario: A landing claim loses its proof

- **WHEN** a test a landing or README entry names is renamed or skipped
- **THEN** `pnpm lint:claims` SHALL fail and name the claim

#### Scenario: The Spanish inventory drifts

- **WHEN** `packages/landing/index.html` shows English copy that `i18n/en-strings.json` does not hold
- **THEN** the landing test suite SHALL fail
