## MODIFIED Requirements

### Requirement: V1 bridge discovery via env vars

~~In V1, bridge extension IDs SHALL be configured via Vite environment variables (e.g., `VITE_GARMIN_EXTENSION_ID`). The SPA SHALL attempt to detect each configured bridge on boot and periodically thereafter.~~

**Replaced by**: Runtime content script discovery. Bridge extensions announce their presence via `window.postMessage` from injected content scripts. The SPA discovers bridges by listening for these announcements. No build-time configuration is required.

The `VITE_GARMIN_EXTENSION_ID` and `VITE_TRAIN2GO_EXTENSION_ID` environment variables SHALL be removed from the SPA codebase.

#### Scenario: Garmin bridge discovered at runtime

- **WHEN** the Garmin Bridge extension is installed and announces via content script
- **THEN** the SPA SHALL detect the bridge via the announcement, verify with a ping, and register it as VERIFIED

#### Scenario: Bridge extension not installed

- **WHEN** no bridge extension announces and the discovery timeout expires
- **THEN** the SPA SHALL not show bridge-related UI for that platform
