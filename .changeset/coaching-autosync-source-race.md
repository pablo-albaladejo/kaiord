---
"@kaiord/workout-spa-editor": patch
---

Fix a race in the coaching auto-sync hook: when bridge detection resolved
after profile/week state settled, the first effect run saw zero sync sources
and stamped the fired-week key anyway, permanently skipping that week's
auto-sync. The key is now only stamped once real targets exist, so the re-run
triggered by the source list populating fires the sync as intended.
