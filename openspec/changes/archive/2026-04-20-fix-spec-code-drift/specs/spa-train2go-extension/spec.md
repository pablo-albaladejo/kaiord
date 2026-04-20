## ADDED Requirements

### Requirement: 30-second detection cache is enforced by the store action

The Train2Go detection cache described in `Train2Go state management` SHALL be enforced at the action level: `detectAction` reads `lastDetectionTimestamp` and `extensionInstalled` from the store and short-circuits when the extension is already installed and less than 30 000 ms have elapsed since the last probe.

#### Scenario: Cache short-circuits redundant detection

- **GIVEN** `extensionInstalled === true` and `lastDetectionTimestamp === Date.now() - 10_000`
- **WHEN** any caller dispatches `detect()`
- **THEN** the store SHALL NOT send a fresh `ping` to the extension
- **AND** the previously cached `userId`/`userName`/`sessionActive` values SHALL be preserved

#### Scenario: Cache expires after 30 seconds

- **GIVEN** `extensionInstalled === true` and `lastDetectionTimestamp === Date.now() - 35_000`
- **WHEN** any caller dispatches `detect()`
- **THEN** the store SHALL issue a fresh `ping` to the extension
- **AND** `lastDetectionTimestamp` SHALL be updated to the new probe's completion timestamp

#### Scenario: Cache is bypassed when extension is not installed

- **GIVEN** `extensionInstalled === false` (first boot or after a removal)
- **WHEN** any caller dispatches `detect()`
- **THEN** the store SHALL always issue a fresh `ping` regardless of `lastDetectionTimestamp`
