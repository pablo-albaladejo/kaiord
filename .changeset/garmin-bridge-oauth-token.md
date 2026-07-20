---
"@kaiord/garmin-bridge": minor
---

Authenticate to Garmin with an OAuth token minted from the user's session
instead of the cookie/CSRF content-script relay.

**Why**: the old flow needed an open `connect.garmin.com` tab, captured the
`connect-csrf-token` via `webRequest`, and relayed every call same-origin
through a content script — fragile across tab reloads and service-worker cold
starts, and it demanded the `tabs`/`webRequest`/`scripting` permissions.

**What changed**: a new `garmin-oauth.js` module mints an OAuth token by
reusing the user's existing Garmin single-sign-on session — **no password is
entered or seen by the extension**. It exchanges the session for a service
ticket, then an OAuth1 token (2-legged HMAC-SHA1), then an OAuth2 Bearer
(3-legged), and calls `connectapi.garmin.com` directly with
`Authorization: Bearer`. The access token is refreshed with the long-lived
OAuth1; a 401 re-mints from the session. Tokens persist in
`chrome.storage.local` and survive cold starts. The OAuth1 signer is verified
byte-for-byte against the `oauth-1.0a` reference in the unit tests.

**Surface impact** (Chrome Web Store re-review): permissions drop from
`storage, tabs, webRequest, scripting` to just `storage`; host permissions add
`connectapi.garmin.com` and `sso.garmin.com` (for the API and the ticket
exchange) alongside `connect.garmin.com`; the `connect.garmin.com` content
script and `content.js` are removed. The `ping` response reports
`authenticated` in place of `csrfCaptured` (the SPA's Zod schema strips both);
auth failures now carry `needsReauth: true`. The SPA message contract
(protocolVersion, capabilities, list/push/activities/profile-snapshot) is
unchanged.
