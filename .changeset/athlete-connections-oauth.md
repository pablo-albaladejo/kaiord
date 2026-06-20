---
"@kaiord/workout-spa-editor": minor
---

Athlete Connections: real connect/disconnect semantics. Connection state is now
a first-class per-(profile, provider) record (device-local, excluded from the
cloud snapshot, cascade-deleted with the profile) instead of being inferred from
integration policies. Each brand declares a connect mechanism:

- **intervals.icu** — connect with a personal API key (validated against the
  intervals.icu API, stored AES-GCM encrypted at rest).
- **Garmin** — bridge connection; disconnect is now a real unlink (clears the
  local linkage and disables the bridge's flows), not just a policy toggle.
- **Strava / Wahoo** — an honest "not supported yet" state (no fake connect).
  OAuth for these needs a token-exchange backend and remains a follow-up.

Dexie v24 adds the device-local `connections` store (index-only, non-destructive).
