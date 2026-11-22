## ADDED Requirements

### Requirement: Every claim on a registered surface has a register entry

The register (`claims/*.json`) SHALL list the surfaces it covers, each a file
or named sections or locale keys of one. Every unit of text a reader sees on a
registered surface (a heading, a list item, a table row, a paragraph, or a
named locale `message`) SHALL equal, after whitespace is collapsed, the `text`
of an entry in the same register file. `scripts/check-claims.mjs`
(`pnpm lint:claims`, part of `pnpm lint`) SHALL fail otherwise and quote the
unit.

#### Scenario: A sentence is added to a registered surface

- **WHEN** a paragraph with no register entry is added to a registered surface
- **THEN** `pnpm lint:claims` SHALL fail and name the file and the paragraph

#### Scenario: A registered sentence is reworded

- **WHEN** the text of a registered unit changes and its entry does not
- **THEN** `pnpm lint:claims` SHALL fail on the new text and on the stale entry

#### Scenario: A registered section disappears

- **WHEN** a section or locale key named by a surface is missing
- **THEN** `pnpm lint:claims` SHALL fail rather than register an empty surface

### Requirement: Every register entry points to a proof that exists

Each entry SHALL have at least one proof: a repo file, optionally still
holding a given text; a test file with a running test of the given title; or
an https endpoint, which for `kaiord.com` names the repo file that serves it.
The guard SHALL fail when a proof no longer exists, when a test is skipped,
when an entry or proof has an unknown field, when an entry is on none of its
surfaces, and when a surface or a claim id is in two register files.

#### Scenario: The proving test is removed

- **WHEN** the test an entry names is deleted, renamed or skipped
- **THEN** `pnpm lint:claims` SHALL fail and name the claim

#### Scenario: The proving code changes

- **WHEN** a proof file no longer holds the text the entry pins
- **THEN** `pnpm lint:claims` SHALL fail and name the claim

### Requirement: Kaiord for Garmin texts are registered

The Garmin `extDescription`, the Short and Detailed Description of its store
listing, its permission justifications and its privacy-policy section SHALL be
registered surfaces. They SHALL state that the Garmin tokens may be kept in
the athlete's browser and never travel to Kaiord, proven by a test that no
answer to an external action carries a token and that every request the
extension makes goes to Garmin.

#### Scenario: A token reaches the Kaiord App

- **WHEN** any external action's answer would contain a minted token
- **THEN** `token-confinement.test.js` SHALL fail
