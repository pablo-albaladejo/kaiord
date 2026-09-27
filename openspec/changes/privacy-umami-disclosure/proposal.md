# Proposal: Disclose Umami analytics in the privacy policy

## Why

The privacy policy at `packages/docs/legal/privacy-policy.md` said Kaiord "does
**not** collect any personal data, analytics, or telemetry" and "does not use
any third-party analytics services". That has been false since #938, which put
Umami (cloud.umami.is) on the landing page, the docs and the web editor. The
canonical spec `privacy-policy` mandated the false sentence (the "Data
collection" bullet and the "Policy states no data collection" scenario), so
the spec, the policy and the product disagreed, and nothing could catch it.

Separately, CI could not have caught a regression here before merge: a PR
whose changes are only Markdown plus files under `packages/docs/**` or
`packages/landing/**` matched no `detect-changes` path group except `docs`, so
`should-test=false` skipped `build`, `lint` and `test`, including
`pnpm test:scripts`, which runs this policy's lint tests.

## What Changes

- The policy states, verbatim: "We use Umami, a privacy-friendly, cookie-less
  analytics tool. It records anonymous page views and product events (e.g.
  'workout exported'); never your workouts, health data or API keys." It keeps
  "We do not use cookies for tracking." and drops the false "no third-party
  analytics" sentence. `Last updated` is bumped. The per-extension "No
  Telemetry" bullets stay: the extensions still have none.
- `check-privacy-policy.mjs` gains a whole-document rule requiring that exact
  disclosure sentence. A test puts the old "no analytics" sentence back and
  asserts that this rule, and only this rule, fails.
- `privacy-policy` spec: the "Data collection" bullet, the "No third-party
  sharing" bullet and the "Policy states no data collection" scenario are
  modified to require the disclosure; a new "Policy discloses anonymous
  analytics" scenario states it and another pins the lint failure. The old
  scenario keeps its name, because a MODIFIED block cannot drop or rename a
  scenario (`openspec validate` refuses), but now requires only what is true:
  no personal data is collected server-side, and no "no analytics" claim.
- `.github/workflows/ci.yml` `detect-changes` gains a `docs_site` group
  (`packages/docs/**`, `packages/landing/**`) and the docs-only skip condition
  requires it to be unchanged, so docs-site and landing PRs run `build`,
  `lint` and `test` before merge.

## Impact

- Affected specs: `privacy-policy` (MODIFIED "Privacy policy content").
  `ci-build-fanout` is **not** modified: it states the docs-only short-circuit
  in terms of `should-test` and never enumerates the `detect-changes` groups,
  so adding a group changes no requirement text.
- There is **no Spanish privacy policy** (`packages/docs` has no `es/` tree and
  the landing `i18n/es.json` carries no policy copy), so there is nothing else
  to update. A future ES locale does not include the policy.
- CI cost: PRs touching `packages/docs/**` or `packages/landing/**` no longer
  take the docs-only fast path.
