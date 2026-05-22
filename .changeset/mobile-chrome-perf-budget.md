---
"@kaiord/workout-spa-editor": patch
---

fix(e2e): relax `useMatchedSessions` performance budget to 60ms on the Mobile Chrome project (kept at 30ms for chromium / firefox / webkit / Mobile Safari). The Mobile Chrome runner consistently measured 43-48ms in PR #648 and #650 post-merge runs vs ~10-20ms on desktop chromium — pure CI runner CPU contention, not a code regression.
