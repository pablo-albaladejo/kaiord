---
"@kaiord/workout-spa-editor": patch
"@kaiord/i18n": patch
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
"@kaiord/tanita-bridge": patch
"@kaiord/trainingpeaks-bridge": patch
"@kaiord/whoop-bridge": patch
---

A Connection that does not work shows one notice with one fix, worded once for the Kaiord App and every extension popup, in English and Spanish: Install Kaiord for the Platform, Update Kaiord for the Platform, Sign in to the Platform, or Try again when the Platform is not answering. A working Connection shows no notice. An outdated extension is offered Update on every Platform instead of being reported as a signed-out Session, and an extension on another protocol version is no longer taken for one that is not installed; a check that failed or got no answer never says "signed out"; the WHOOP popup and the App read the same answer the same way. The popups show the English wording until the extensions are translated. `pnpm lint` fails on a fifth fix or a second wording in the App or an extension.
