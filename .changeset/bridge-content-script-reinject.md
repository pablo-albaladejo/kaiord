---
"@kaiord/garmin-bridge": minor
"@kaiord/train2go-bridge": minor
---

Re-inject content scripts after extension reload (DX). Chrome MV3 terminates content scripts in existing tabs when the extension is reloaded but does NOT re-inject them automatically — `chrome.tabs.sendMessage` to those tabs fails with "Receiving end does not exist", silently breaking `train2goFetch` / `garminFetch` until the user closes and reopens every Train2Go / Garmin tab. Both bridges now run a re-inject pass on `chrome.runtime.onInstalled`, programmatically injecting their content script into matching open tabs whose URL is covered by `host_permissions`. Adds the `scripting` permission and goldens are updated accordingly.
