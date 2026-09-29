---
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
"@kaiord/tanita-bridge": patch
"@kaiord/whoop-bridge": patch
"@kaiord/trainingpeaks-bridge": patch
---

Accept external messages from the apex production origin `https://kaiord.com`. The editor is served at `https://kaiord.com/app`, but the sender allowlist required a subdomain, so every message from production was refused with "Origin or action not permitted" and the editor detected no installed bridge. Subdomains of kaiord.com and the localhost dev ports are still accepted; any other origin is still refused.
