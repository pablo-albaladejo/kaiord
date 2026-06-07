---
"@kaiord/workout-spa-editor": patch
---

The default view is the calendar

Opening the app (`/`), unknown routes, the header logo, undated create
close, and unknown back-origins now land on the current week's calendar
grid instead of the Today dashboard. Today remains available at `/today`
via its nav tab and header entry; explicit "Go to Today" links keep
pointing there. The route announcer reads "/" as "Calendar page" and the
Calendar nav entry is active on the index route.
