---
"@kaiord/train2go-bridge": minor
---

Migrate the Train2Go Bridge from a content-script relay to service-worker-direct.
The service worker now fetches the training-plan endpoints on `app.train2go.com`
itself with `credentials:"include"` via the shared identity-free `session-fetch`
transport, so the site's HttpOnly session cookie travels automatically — no
content script on `app.train2go.com` and no relay hop. Permissions shrink from
`["tabs","storage","scripting"]` to `["storage"]`. A dead session (redirect or
login response) is now reported as `needsReauth` so the editor can prompt a
re-login. The path allowlist, HTML parser, and profile-snapshot surface are
unchanged.
