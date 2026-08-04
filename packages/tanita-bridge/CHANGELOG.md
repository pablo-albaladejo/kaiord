# @kaiord/tanita-bridge

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
