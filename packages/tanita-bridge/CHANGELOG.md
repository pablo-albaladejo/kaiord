# @kaiord/tanita-bridge

## 10.0.0

### Minor Changes

- 0aac6b8b: Add `@kaiord/tanita-bridge`, a service-worker-direct Chrome extension that reads the user's own MyTANITA body-composition CSV export through their existing logged-in `mytanita.eu` session (`credentials:"include"`) — no password, no `cookies` permission, no content script on `mytanita.eu`. Raw CSV is returned verbatim (`read:body`); parsing lives in `@kaiord/tanita`, called SPA-side. Ships with the background/session-fetch unit-test suite and every repo guard wired for a new bridge (bridge-core parity, privacy-surface golden, docs privacy-policy disclosure, commitlint scope, changeset linked group, architecture package deps, extension-version sync).
