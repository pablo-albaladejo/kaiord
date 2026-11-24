## ADDED Requirements

### Requirement: Every fix opens a page that exists

Install and Update SHALL open the extension's own store listing where the
repository holds its address (Garmin), and otherwise
`https://kaiord.com/docs/guide/install-extensions`, which lists each
extension, its store link where known, and how to load an unpublished one
unpacked, in English and Spanish. Sign in and Open open the Platform's page
the popup opens. `scripts/check-site-links.mjs` SHALL fail when a fix target
in `connection-fix-target.ts` is a page the built site does not serve.

#### Scenario: A fix target the site does not serve

- **WHEN** a fix target names a docs page that the build does not produce
- **THEN** `check-site-links` fails and names it
