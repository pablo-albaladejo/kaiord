---
"@kaiord/garmin-bridge": minor
"@kaiord/train2go-bridge": minor
"@kaiord/whoop-bridge": minor
"@kaiord/trainingpeaks-bridge": minor
"@kaiord/tanita-bridge": minor
---

The extension popup now follows the theme picked in the Kaiord app — light, dark or system — instead of always rendering dark. The app sends its preference through the new `set-theme` action (Kaiord origins only, three accepted values); until the app has sent one, the popup follows the operating-system colour scheme.
