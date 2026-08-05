# @kaiord/whoop-bridge

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

### Patch Changes

- a16c648: Ship English-only extension UI: remove the `_locales/es` (Spanish) locale from
  the Garmin, Train2Go, and Whoop bridges so every bridge exposes a single,
  audited English surface — matching each manifest's `default_locale: "en"`. A
  new `scripts/check-bridge-locales-english-only.test.mjs` guard (run under
  `test:scripts`) now fails CI if any `packages/*-bridge/_locales/` reintroduces a
  non-`en` locale.

## 10.0.0

### Minor Changes

- d21424e: Adopt the vendored bridge-core masters (`packages/_shared/bridge-core/`): shared response envelope/dispatch factories, announce content script (driven by a per-bridge `bridge-identity.js`), popup utilities, snapshot popup module + shared CSS (garmin/train2go), profile-snapshot validator, and test mocks — synced byte-identically via `pnpm bridge:sync` and locked by a parity guard. External dispatch is now uniformly origin-pinned and action-allowlisted in every bridge (previously only snapshot actions were origin-checked in garmin/train2go); allowlists equal each bridge's full external action surface, so SPA flows are unaffected. The train2go announce message now matches its ping manifest (name + `read:training-zones`), fixing a pre-existing announce/ping divergence.
