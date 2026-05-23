---
"@kaiord/workout-spa-editor": patch
---

fix(e2e): raise calendar-performance budgets to chromium-runner-tolerant ceilings (FCP 1800ms, useMatchedSessions 60ms). The test runs ONLY on chromium engines (skipped on firefox/webkit/Mobile Safari upstream), so both desktop chromium and Mobile Chrome share the same GH Actions runner contention envelope. PR #651's Mobile-Chrome-only relaxation was insufficient — desktop chromium hit the same flake post-merge of PRs #654 and #655.
