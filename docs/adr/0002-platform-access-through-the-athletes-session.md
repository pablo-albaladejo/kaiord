---
status: accepted
---

# Platforms are reached through the athlete's own Session

Kaiord reaches every Platform through the athlete's authenticated Session in their own browser, lent to the Kaiord App by a Bridge, and not through official partner APIs or a server of ours. The principle is that an athlete accesses their own data with their own login; the price is that access is unofficial, can break without notice, and may conflict with a Platform's terms. We accept that risk and declare it instead of hiding it.

Standards come first everywhere else: the core speaks KRD, open file formats, MCP and A2A. A Bridge is the edge where a Platform with no standard API is isolated, so nothing specific to that Platform reaches the core. When a Platform offers an official API an athlete can use without a server of ours, the Bridge is replaced by it.

## Considered Options

- **A proxy we host** (a Lambda behind Tailscale was built for Garmin and replaced within a week): rejected because it puts the athlete's credentials and data on Kaiord infrastructure, which contradicts keeping no accounts and no stored user data.
- **Official OAuth** (tried for WHOOP, then dropped): rejected where it requires a registered partner application and a server-side secret, for the same reason.

## Consequences

- A public register states, per Platform, that access is unofficial, what the Platform's terms say about it, and what the athlete loses if it is cut off.
- A Bridge whose Platform expressly prohibits this access is not published to the extension store and is marked experimental in the Kaiord App. Today that is WHOOP; Garmin and Train2Go are published, and Tanita and TrainingPeaks are to be published but are not yet.
- The Garmin Bridge mints tokens with Garmin's consumer key and secret as published by third parties. The register says so in those words.
- A Bridge may keep Session tokens in the athlete's browser. They never travel to Kaiord.
- Every Bridge is disposable: the Kaiord App must stay usable with any Bridge missing.
