---
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
"@kaiord/whoop-bridge": patch
"@kaiord/trainingpeaks-bridge": patch
"@kaiord/tanita-bridge": patch
---

Repaint the shared bridge popup shell onto the rebuilt brand palette. The
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
