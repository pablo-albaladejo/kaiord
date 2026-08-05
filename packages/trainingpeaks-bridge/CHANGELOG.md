# @kaiord/trainingpeaks-bridge

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

- b95f6a7: Add the `@kaiord/trainingpeaks-bridge` Chrome extension: an SW-direct
  TrainingPeaks bridge with a dual transport and no password. The durable
  credential is the user's own `Production_tpAuth` session cookie; the service
  worker exchanges it cookie-only (`credentials:"include"`, no `Authorization`)
  at `GET /users/v3/token` via the vendored `session-fetch` master, caches the
  ~1h Bearer, then reads/writes body metrics on `tpapi.trainingpeaks.com` via the
  vendored `bearer-fetch` master (`credentials:"omit"` + `Authorization: Bearer`),
  re-exchanging once on a 401. It reads consolidated timed metrics (`read:body`)
  and can push a `type 9` weight measurement (`write:body`); raw JSON is parsed
  SPA-side in `@kaiord/trainingpeaks`. Single disclosed host
  (`https://tpapi.trainingpeaks.com/*`), `storage` permission only, no `cookies`
  permission, and no content script on TrainingPeaks. On a dead session it reports
  `needsReauth` so the editor can prompt a re-login.

## 10.0.0

### Minor Changes

- b95f6a74: Add `@kaiord/trainingpeaks-bridge`, an SW-direct MV3 Chrome extension with a dual transport and no password. The durable credential is the user's own `Production_tpAuth` session cookie; `tp-auth.js` orchestrates two vendored identity-free masters: a cookie-only `GET /users/v3/token` exchange (`credentials:"include"`, no `Authorization` header) that mints a ~1h Bearer, cached with a 60s refresh buffer, and Bearer-authenticated data calls (`credentials:"omit"`) that re-run the exchange once on a 401. Actions: `read-metrics` (`read:body`), `push-weight` (`write:body`, a type-9 weight metric), and `ping`/`checkSession`. Raw JSON is returned verbatim and parsed SPA-side by `@kaiord/trainingpeaks`. Declares a single disclosed host (`https://tpapi.trainingpeaks.com/*` — the domain-wide `.trainingpeaks.com` cookie reaches it automatically) and only the `storage` permission; no `cookies`, `tabs`, `webRequest`, or `scripting`.
