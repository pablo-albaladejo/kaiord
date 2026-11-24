---
"@kaiord/workout-spa-editor": patch
"@kaiord/i18n": patch
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
"@kaiord/tanita-bridge": patch
"@kaiord/trainingpeaks-bridge": patch
"@kaiord/whoop-bridge": patch
---

No extension hands the Kaiord App a secret tied to the athlete's sign-in: Train2Go's anti-forgery token is removed from the pages it returns, and every extension removes token, CSRF and session fields from its answers. Kaiord for Garmin uploads only the body-composition file and the workout shape the App builds; the WHOOP content script reads only its closed list. A Connection is said to be signed out only when the Platform said so. The store Garmin and TrainingPeaks extensions are no longer asked a check that reads a workout or creates a token. A WHOOP sign-in with no account id, or with no WHOOP tab open, shows the same notice in the popup and the App, and "not checked" says the real reason for each Platform. Install and Update open Garmin's store listing or the new guide to installing the extensions.
