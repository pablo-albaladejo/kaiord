---
"@kaiord/garmin-bridge": patch
---

Garmin popup now renders the "Last push · X ago — <name>" line in the disconnected state too. Previously the rollup region was only painted on the happy path (ping ok AND `gcApi.ok`), so users with an expired Garmin Connect session never saw their SPA→bridge sync timestamp even though the data was already in `chrome.storage.local`. The receipt is independent of the upstream Garmin session — it tells the user when the SPA last updated their profile.
