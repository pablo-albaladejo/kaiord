---
"@kaiord/workout-spa-editor": minor
---

Serve the app at `/app/` and carry the route in the URL fragment, so a deep link never answers 404 on the way to itself.

Every deep URL used to return HTTP 404 first: the static host has no file at `/editor/calendar/2026-W32`, so it served the landing's error page, which then redirected into the app. The error page was fully painted before the redirect ran, because the redirect script was appended after `</body>`.

The route now lives in the fragment (`/app/#/calendar/2026-W32`), so the browser only ever requests `/app/` — a file that exists — and every route, including unbounded ones like `/workout/<uuid>` that cannot be pre-generated, resolves in a single 200 response. `/editor/*` links already shared, bookmarked, or shipped inside the published Chrome extensions keep working through a bridge with no end date; the redirect now sits in `<head>`, and the build fails if it ever moves after the visible markup again.
