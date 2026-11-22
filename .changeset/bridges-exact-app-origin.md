---
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
"@kaiord/tanita-bridge": patch
"@kaiord/trainingpeaks-bridge": patch
"@kaiord/whoop-bridge": patch
---

Each extension now answers the exact Kaiord App origin, `https://kaiord.com`, and no other: a message from a subdomain (`www` included) or any other site gets no answer at all. The manifests declare `https://kaiord.com/*` instead of `https://*.kaiord.com/*`, and the Vite dev origins are accepted only in a development build.

In a development build the announce content script runs on the two Vite dev servers (`http://localhost:5173`, `http://localhost:5174`) only, no longer on every localhost port.
