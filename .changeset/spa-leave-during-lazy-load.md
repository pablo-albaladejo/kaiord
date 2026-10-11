---
"@kaiord/workout-spa-editor": patch
---

Leaving the editor while a page is still loading now leaves. In Firefox, starting a navigation away cancels the page's pending downloads, and the stale-build recovery mistook that for an outdated deploy and reloaded the app instead of following the navigation.
