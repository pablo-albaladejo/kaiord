# @kaiord/tanita-bridge

## 10.1.1

### Patch Changes

- d42c48b: Repaint the shared bridge popup shell onto the rebuilt brand palette. The
  `--kd-*` literals in `packages/_shared/bridge-core/popup.css` now mirror the
  achromatic neutrals and the control ramp instead of the retired accent blue and
  the tip/warning hues, which collided with training zones Z3 and Z4 and failed
  WCAG AA. A primary CTA paints `--kd-control` with `--kd-control-ink` on top —
  white-on-white was the failure mode the old `--kd-text-primary` pairing would
  have produced. Status blocks encode state by lightness rather than hue until
  the popup redesign adds icons.

  `scripts/check-bridge-popup-tokens-parity.test.mjs` still pins every literal to
  its source, now resolving each role's `var()` chain and oklch value rather than
  string-matching hex, so the guard survives the palette being expressed in
  oklch. Layout, copy and the per-bridge accent dot are unchanged.

## 10.1.0

### Minor Changes

- 0aac6b8: Add the `@kaiord/tanita-bridge` Chrome extension: an SW-direct MyTANITA bridge
  that reads the user's own body-composition CSV export through their existing
  logged-in `mytanita.eu` session (`credentials:"include"`), with no password,
  no `cookies` permission, and no content script on `mytanita.eu`. The service
  worker returns the raw CSV verbatim (`read:body` capability); parsing lives in
  `@kaiord/tanita` and runs SPA-side. On a dead session (redirect / login page)
  it reports `needsReauth` so the editor can prompt a re-login.

## 10.0.0

### Minor Changes

- 0aac6b8b: Add `@kaiord/tanita-bridge`, a service-worker-direct Chrome extension that reads the user's own MyTANITA body-composition CSV export through their existing logged-in `mytanita.eu` session (`credentials:"include"`) — no password, no `cookies` permission, no content script on `mytanita.eu`. Raw CSV is returned verbatim (`read:body`); parsing lives in `@kaiord/tanita`, called SPA-side. Ships with the background/session-fetch unit-test suite and every repo guard wired for a new bridge (bridge-core parity, privacy-surface golden, docs privacy-policy disclosure, commitlint scope, changeset linked group, architecture package deps, extension-version sync).
