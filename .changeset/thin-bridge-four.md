---
"@kaiord/garmin-bridge": patch
"@kaiord/tanita-bridge": patch
"@kaiord/trainingpeaks-bridge": patch
"@kaiord/whoop-bridge": patch
"@kaiord/train2go-bridge": patch
"@kaiord/workout-spa-editor": patch
---

Kaiord for Garmin, Tanita, TrainingPeaks and WHOOP become thin Bridges (protocol version 2): each lends the athlete's Session and executes `{ action: "request", method, path, body? }` only for an entry of its closed list, accepting a body only on the writes that need one and only in the shape declared for it, and hands the Kaiord App the Platform's answer as it came. Reading Garmin's schedule ids and calendar months, pacing and retrying the Garmin activities pull, telling a MyTANITA login page from the export, building TrainingPeaks paths and reading its answers, and reading WHOOP's bodies move to the Connectors in the Kaiord App, typed and tested. Tokens stay in the extensions and are minted only before a real request. The App still works with an extension on protocol 1 while it updates. Each extension's internal channel now answers only its own popup, never a content script. The shared Bearer transport no longer collides with the cookie transport in one service worker, which kept Kaiord for TrainingPeaks from loading it. The popups show what they showed before.
