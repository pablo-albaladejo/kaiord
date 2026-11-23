## ADDED Requirements

### Requirement: Every extension is accepted on the thin protocol and the one before it

The Kaiord App SHALL accept protocol versions 1 and 2 for each of the five extensions (`garmin-bridge`, `tanita-bridge`, `train2go-bridge`, `trainingpeaks-bridge`, `whoop-bridge`) at discovery and in the Session probes, and SHALL send each Platform call as `request` first, sending the legacy action instead when the extension answers in a protocol-1 envelope.

#### Scenario: The store version keeps working

- **GIVEN** an extension that answers `request` with `Origin or action not permitted` in a protocol-1 envelope
- **WHEN** the App makes a call through it
- **THEN** the App sends the legacy action and uses its answer

#### Scenario: A protocol the App does not know is outdated

- **GIVEN** an extension announcing protocol 3
- **WHEN** discovery verifies it
- **THEN** it is remembered as outdated and its fix is Update
