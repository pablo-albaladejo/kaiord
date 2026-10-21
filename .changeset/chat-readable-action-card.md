---
"@kaiord/workout-spa-editor": patch
---

The chat's action confirmation card now labels all six actions and describes each one in words (in English and Spanish) instead of showing the raw tool input as JSON. A Garmin push names the workout, with its duration and date, looked up in the active athlete's library. Garmin pushes and coaching syncs say that they reach outside the device. A new workout shows its sport (when it is one the app knows) and a logged meal its slot. When the card cannot read what the assistant sent (a day that does not exist, an unknown data type, a malformed source order), or a Garmin push's workout is still loading or not in the active athlete's library, Approve is disabled so nothing is approved blind; Decline still works.
