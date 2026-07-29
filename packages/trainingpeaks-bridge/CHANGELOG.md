# @kaiord/trainingpeaks-bridge

## 10.0.0

### Minor Changes

- b95f6a74: Add `@kaiord/trainingpeaks-bridge`, an SW-direct MV3 Chrome extension with a dual transport and no password. The durable credential is the user's own `Production_tpAuth` session cookie; `tp-auth.js` orchestrates two vendored identity-free masters: a cookie-only `GET /users/v3/token` exchange (`credentials:"include"`, no `Authorization` header) that mints a ~1h Bearer, cached with a 60s refresh buffer, and Bearer-authenticated data calls (`credentials:"omit"`) that re-run the exchange once on a 401. Actions: `read-metrics` (`read:body`), `push-weight` (`write:body`, a type-9 weight metric), and `ping`/`checkSession`. Raw JSON is returned verbatim and parsed SPA-side by `@kaiord/trainingpeaks`. Declares a single disclosed host (`https://tpapi.trainingpeaks.com/*` — the domain-wide `.trainingpeaks.com` cookie reaches it automatically) and only the `storage` permission; no `cookies`, `tabs`, `webRequest`, or `scripting`.
