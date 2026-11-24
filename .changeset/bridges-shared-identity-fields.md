---
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
"@kaiord/tanita-bridge": patch
"@kaiord/trainingpeaks-bridge": patch
"@kaiord/whoop-bridge": patch
---

The identity and contact fields every extension removes from its answers (name, contact details, birth date and gender) are now one shared list, vendored into each extension; each extension's own list adds its Platform's fields to it. What is removed is unchanged.
