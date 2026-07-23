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
