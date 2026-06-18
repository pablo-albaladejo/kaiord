---
"@kaiord/workout-spa-editor": minor
---

Make the Settings "Units" and "Notifications" rows functional (previously
display-only). A new Preferences tab persists a per-profile `units`
(metric/imperial) preference and a browser-notification toggle.

Units are display-only — canonical data stays in SI. Choosing imperial
relabels workout step-target pace (min/km → min/mi), athlete threshold pace and
zones (running min/mi, swimming /100yd), and weight surfaces (kg → lb) in the
weight history and health trends. The Notifications toggle drives the real
browser Notification permission rather than being a dead control.
