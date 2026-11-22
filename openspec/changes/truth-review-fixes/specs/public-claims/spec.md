## ADDED Requirements

### Requirement: A test proof is a test that runs

A test proof SHALL hold only when its title is the first argument of an
`it(` or `test(` call in code, outside comments and string literals, and
neither that call nor any `describe` around it is skipped, todo, conditional,
or left out by an `.only` elsewhere in the file.

#### Scenario: The title sits in a skipped describe

- **WHEN** the titled test is inside `describe.skip`
- **THEN** `pnpm lint:claims` SHALL fail and name the claim

#### Scenario: The title sits in a comment or a string

- **WHEN** `it("title"` appears only in a comment or a string literal
- **THEN** `pnpm lint:claims` SHALL fail and name the claim

### Requirement: A text appears as often as the register accounts for it

The number of times a unit text appears on a register's surfaces SHALL equal
the number of that register's entries with that text, each counting its
`count` (default 1).

#### Scenario: A short unit is added a second time

- **WHEN** a second "5" is added to a surface whose register has one "5"
- **THEN** `pnpm lint:claims` SHALL fail and name the text and both numbers

### Requirement: A claim that states a fact has a real proof

An entry SHALL be a label (`kind: "label"`, no proof), an external claim
(`kind: "external"`, an https `url` and a `read_on` date no older than 180
days), or a claim proven by a running test or by a pin of at least 16
characters in a file that is not one of its register's surfaces. The guard
SHALL print how many claims, labels and external claims there are and how
many are proven by test and by pinned code.

#### Scenario: A fact is proven by its own surface

- **WHEN** a claim's only proof is its surface file or a file existing
- **THEN** `pnpm lint:claims` SHALL fail and say to prove it or declare it a label

#### Scenario: An external reading goes stale

- **WHEN** an external claim's `read_on` is more than 180 days old
- **THEN** `pnpm lint:claims` SHALL fail and name the URL to read again

### Requirement: The HTML a search engine shows is read

On an HTML surface the guard SHALL also read `placeholder`,
`aria-description`, the keywords meta and every string a search engine shows
from the page's JSON-LD (names, descriptions, answers, feature lists).

#### Scenario: A JSON-LD description is not registered

- **WHEN** a JSON-LD `description` has no register entry
- **THEN** `pnpm lint:claims` SHALL fail and quote it

### Requirement: No public text uses a retired term

`scripts/check-retired-terms.mjs` (`pnpm lint:retired-terms`, in `pnpm lint`)
SHALL fail when a registered surface or a listed non-prose file uses
framework, cockpit, lossless, zero data loss, round-trip safe, open standard,
interchange format, or platform for Kaiord itself, in English or Spanish,
outside an allowed exact phrase.

#### Scenario: A page calls Kaiord a framework

- **WHEN** a registered surface says "Kaiord is a framework"
- **THEN** `pnpm lint:retired-terms` SHALL fail and name the file and term

#### Scenario: A Platform is called a platform

- **WHEN** a text says "Garmin is the platform that decides"
- **THEN** `pnpm lint:retired-terms` SHALL pass

### Requirement: The data statement names every destination

The landing's data statement SHALL name, in English and Spanish, the
destination of every remote origin the site's content security policy allows,
and say separately what Umami analytics records.

#### Scenario: A new origin is allowed

- **WHEN** an origin is added to the policy and the statement does not name it
- **THEN** the `site-csp-policy` test SHALL fail
