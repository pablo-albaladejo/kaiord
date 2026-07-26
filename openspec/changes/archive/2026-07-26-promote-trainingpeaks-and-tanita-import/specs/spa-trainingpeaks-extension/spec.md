## ADDED Requirements

### Requirement: TrainingPeaks is a first-class bridge integration

The SPA integration registry SHALL declare TrainingPeaks with
`mechanism: "bridge"` and `bridgeId: "trainingpeaks-bridge"`, so a verified
announce from the extension registers it like any other bridge.

#### Scenario: Installed extension becomes a connected integration

- **GIVEN** the trainingpeaks-bridge extension is installed and announces itself
- **WHEN** the SPA verifies the announcement
- **THEN** `trainingpeaks-bridge` SHALL appear in the discovered bridges and the Athlete Connections page SHALL render TrainingPeaks as a connected bridge row

### Requirement: Weight import is policy-gated and session-gated

The SPA SHALL import TrainingPeaks weight metrics only when (a) the bridge
reports an authenticated session via `checkSession`, and (b) an enabled
`weight ← trainingpeaks-bridge` import policy exists for the active profile.
With no enabled route the SPA SHALL NOT fetch from the bridge.

#### Scenario: No enabled route means no fetch

- **GIVEN** trainingpeaks-bridge is discovered with an authenticated session
- **AND** no enabled weight import policy targets trainingpeaks-bridge
- **WHEN** the sync trigger fires
- **THEN** the use case SHALL return `no-policy` without calling the bridge

#### Scenario: Signed-out session means no import

- **GIVEN** trainingpeaks-bridge is discovered but `checkSession` reports `authenticated: false`
- **WHEN** the sync trigger fires
- **THEN** no metrics read SHALL be issued

### Requirement: Imported weight records carry stable provenance

Each imported weight record SHALL be persisted through the shared inbound
natural-key upsert with `sourceBridgeId: "trainingpeaks-bridge"` and
`externalId = canonicalHash({ dataType: "weight", measuredAt })`, so
re-running the import never duplicates a record.

#### Scenario: Re-running the import is idempotent

- **GIVEN** a weight metric already imported from TrainingPeaks
- **WHEN** the same window is imported again
- **THEN** the existing record SHALL be kept and the duplicate SHALL be counted as skipped
