## ADDED Requirements

### Requirement: A public register states the access to each Platform

The docs site SHALL serve `legal/platform-access` with one entry per
Platform: Garmin, Train2Go, Tanita, TrainingPeaks and WHOOP. Each entry SHALL
have three parts: how Kaiord reaches the Platform (through the athlete's own
Session, not an official API), what the Platform's terms say about it, and
what the athlete loses if access is cut off. What the terms say SHALL be a
narrow quotation or paraphrase of the Platform's own published terms, linked
and dated, or a plain statement that they could not be read; it SHALL give no
legal conclusion.

#### Scenario: An entry is missing

- **WHEN** the page lacks an entry for one of the five Platforms, or an entry lacks one of its three parts
- **THEN** `packages/docs/scripts/platform-access.test.mjs` SHALL fail and name the Platform

#### Scenario: How Garmin tokens are minted

- **WHEN** an athlete reads the Garmin entry
- **THEN** it SHALL say that Kaiord for Garmin mints tokens with Garmin's consumer key and secret as published by third parties, and that the tokens stay in the athlete's browser and never travel to Kaiord

### Requirement: The register's claims are proven

Every unit of text on the register SHALL be an entry of
`claims/platform-access.json`, proven by code or a test for behaviour and by
the terms URL, as an endpoint proof, for what a Platform's terms say.

#### Scenario: A sentence is added to the register

- **WHEN** a sentence with no register entry is added to the page
- **THEN** `pnpm lint:claims` SHALL fail and quote it

### Requirement: The register is one link away where it matters

The landing footer and the Connections page of the Kaiord App SHALL link to
the register, in English and in Spanish.

#### Scenario: The athlete connects a Platform

- **WHEN** the Connections page renders, in either locale
- **THEN** it SHALL show a link to `https://kaiord.com/docs/legal/platform-access`

#### Scenario: A visitor reads the landing

- **WHEN** the English or the Spanish landing renders
- **THEN** its footer SHALL link to `/docs/legal/platform-access`
