---
"@kaiord/garmin": minor
---

**Behaviour change:** GCN output that contains `percent_ftp` power targets now requires an FTP. `createGarminWriter({ ftpWatts })` resolves each target as `round(pct × ftpWatts / 100)`; without a usable `ftpWatts` the writer throws `MissingFtpError`. Previously it silently wrote the percentage as watts (85 % FTP became 85 W), so callers that relied on that output must now pass an FTP or handle the error. Watts, watt ranges and power zones are unchanged and need no FTP.
