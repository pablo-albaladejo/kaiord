---
"@kaiord/docs": patch
"@kaiord/workout-spa-editor": patch
---

Converter pages link the editor at `kaiord.com/app/` instead of the legacy `/editor/` path, and docs breadcrumbs link only pages that exist. The SPA gains a route-segment registry, kept in parity with its router, which the new site-link checker uses to validate `/app/#/<route>` links.
