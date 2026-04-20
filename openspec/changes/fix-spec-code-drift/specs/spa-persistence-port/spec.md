## ADDED Requirements

### Requirement: Storage availability banner is rendered when probe fails

The "Storage unavailable — changes in this session won't be saved" banner mandated by `Storage degradation handling` SHALL be observable at runtime: a dedicated `storage-store` runs `probeStorage()` on editor mount, and a top-level `StorageAvailabilityBanner` component subscribes to the store and renders the banner text whenever the probe result is `"failed"`.

#### Scenario: Banner appears when IndexedDB is unavailable

- **WHEN** the editor mounts and `probeStorage()` resolves to `"failed"`
- **THEN** a single `StorageAvailabilityBanner` SHALL render the string `Storage unavailable — changes in this session won't be saved` at the top of the editor layout
- **AND** the banner SHALL remain visible across route changes for the duration of the session

#### Scenario: Banner is absent when storage is healthy

- **WHEN** `probeStorage()` resolves to `"complete"`
- **THEN** `StorageAvailabilityBanner` SHALL render nothing (no DOM node)
