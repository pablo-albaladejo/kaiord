---
"@kaiord/workout-spa-editor": patch
---

UX redesign Phase 1 leftover (start): show a success toast when a
template is loaded into the editor from the library. The library's
"Load into editor" CTA navigates to `/workout/new`; previously the
user landed on the welcome screen with no confirmation that the
template had been loaded. The new toast surfaces a static
`"Template loaded"` title (PII guard R-PIIInterpolation compliant)
with the template name as the description and a 3-second auto-dismiss,
addressing one of the "dead-ends after success" issues identified in
the deep-dive trace. Auto-dismiss + toast for the batch and coaching
completion flows ships in subsequent PRs.
