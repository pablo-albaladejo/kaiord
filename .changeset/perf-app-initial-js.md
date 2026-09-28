---
"@kaiord/workout-spa-editor": patch
"@kaiord/docs": patch
---

Load the Health and new-workout route dispatchers and the Google Drive cloud sync lazily, and budget the SPA's initial JS in CI. The docs now ship one self-hosted Inter file (the preloaded `/docs/fonts/inter-var-latin.woff2`, which was a 404) instead of the 16 Inter subsets bundled by VitePress.
