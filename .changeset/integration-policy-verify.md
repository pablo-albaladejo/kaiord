---
"@kaiord/workout-spa-editor": minor
---

feat(spa-editor): integration-policy verification — Playwright e2e, additivity tests, analytics-port events

Adds end-to-end coverage for the integration-policy-per-profile-routing
feature: Playwright specs for the Data Flows density baseline, the
Garmin push-via-policy happy path, and the Train2Go zones-via-policy
auto-import. Two additivity tests (existing token, new token) prove
AC-10. Analytics-port events fire on policy toggle, import complete,
and export complete; ledger-size gauge captures growth. tasks.md
reflects the completed scope.

PR 7 of 7 (terminal). Closes integration-policy-per-profile-routing.
