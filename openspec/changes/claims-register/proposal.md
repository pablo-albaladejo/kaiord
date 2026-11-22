## Why

Review of 2026-11-22, issue #1625 (parent #1670, "Only what is real is said",
stories 57–59, 66–67). The store listings and privacy texts of the extensions
held 33 false or stale statements, 14 plainly false. Kaiord for Garmin's
listing said "No passwords or tokens stored" while the extension keeps an
OAuth1 and an OAuth2 token in `chrome.storage.local`; its permission
justifications justified a `scripting` permission and a `content.js` that do
not exist. Nothing tied a public sentence to the code that makes it true, so
nothing failed when one went false.

## What Changes

- **Register.** `claims/*.json` lists the registered surfaces and, for every
  claim on them, its exact text and its proof: a file (optionally still
  holding a given text), a running test by title, or an https endpoint.
  `claims/README.md` says how a later ticket adds a surface.
- **Guard.** `scripts/check-claims.mjs` (`pnpm lint:claims`, in `pnpm lint`):
  every unit of text on a registered surface (heading, list item, paragraph,
  table row, named locale message) must equal a register entry; an entry on
  none of its surfaces, a missing section or key, a claim with no proof, an
  unknown field, and a proof that no longer exists all fail.
- **Garmin, proven.** The Short and Detailed Description of
  `packages/garmin-bridge/store-listing.md`, `extDescription`, the whole of
  `privacy-justification.md` and the Garmin section of the privacy policy are
  rewritten from the code and registered in `claims/garmin.json`. They say the
  tokens may be kept in the athlete's browser and never travel to Kaiord,
  proven by the new `test/token-confinement.test.js`. The athlete-facing name
  in prose is "Kaiord for Garmin"; the extension's own name is unchanged
  (#1646). English only.
- **Glossary and decisions.** `GLOSSARY.md` and `docs/adr/0001`–`0004` land.

## Capabilities

### New Capabilities

- `public-claims`: the claims register and its guard.

### Modified Capabilities

- `extension-store-publish`: the Garmin short description.

## Impact

- `scripts/` (guard, two `lib/` helpers, tests), `claims/`, root `package.json`.
- `@kaiord/garmin-bridge` (private): listing texts, `extDescription`, a new
  test. Nothing is published: the description reaches the store only with the
  next version bump, and the dashboard texts are pasted by hand.
- `@kaiord/docs`: the Garmin policy section is renamed "Kaiord for Garmin
  Extension"; `check-privacy-policy` follows the heading, its 14 Garmin rules
  and floor unchanged.
- Out of scope: the other four extensions' texts, the landing and READMEs
  (later tickets add them as surfaces), the store screenshot (needs a capture).
