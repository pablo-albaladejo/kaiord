---
"@kaiord/garmin-bridge": minor
"@kaiord/train2go-bridge": minor
"@kaiord/tanita-bridge": minor
"@kaiord/trainingpeaks-bridge": minor
"@kaiord/whoop-bridge": minor
"@kaiord/workout-spa-editor": patch
---

Checking whether a Connection works costs the athlete nothing. Every extension's Session check answers a typed outcome (`signed-in`, `signed-out`, `not-answering`, `not-checked`) and yes or no only: no id, name, note, workout or token, and it mints and stores nothing.

- Kaiord for Tanita checks with a `HEAD` of the export instead of downloading it.
- Kaiord for TrainingPeaks and Kaiord for Garmin send no request: a token minted for an earlier read or send that has not expired is `signed-in`, otherwise `not-checked`, and the first real read or send mints the token. The TrainingPeaks athlete number travels only to the new `read-athlete-id`, read just before a send.
- Kaiord for Train2Go's `ping` answers yes or no; the athlete's profile and the coach's name and notes travel only to the new `read-profile`, which the connect flow and the popup use.
- The WHOOP extension's `status` carries no WHOOP id or capture time; the id travels only to the new `read-user-id`, read before an import.

The Kaiord App reads the outcome, shows a check that asked nothing as detected rather than as needing attention, lets a send or an import go ahead on it, and falls back to the previous actions for an older extension.
