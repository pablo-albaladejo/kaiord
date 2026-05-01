---
"@kaiord/workout-spa-editor": none
---

ci(deploy-site): fix smoke probe + add scripts/inject-spa-fallback.mjs to trigger paths

The smoke step was failing on every deploy (visible since `cleanup-open-issues-may-2026` Phase 2 landed) because it fetched `/editor/calendar` with curl and expected the SPA bundle marker in the response body. With the rafgraph fallback that body is `404.html` plus a JS `window.location.replace` round-trip — a redirect curl cannot execute. The check could never pass.

Replace the JS-dependent probe with two mechanical curl checks:

1. `/editor/` returns 200 carrying the SPA bundle marker (entry script tag).
2. `/404.html` returns 200 carrying the rafgraph redirect script (`indexOf('/editor/')`).

Together those prove the deep-route fallback contract end-to-end without needing JS execution. Real-browser correctness of the redirect itself is covered by the `e2e-prod-base` Playwright job.

Also adds `scripts/inject-spa-fallback.mjs` to the deploy workflow's trigger paths so future changes to the rafgraph injection script automatically redeploy.
