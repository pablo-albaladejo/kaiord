## ADDED Requirements

### Requirement: The WHOOP Connector reads WHOOP's answers

The WHOOP Connector in the Kaiord App SHALL read a raw answer as its JSON body, or a body that is not JSON cut to its first 500 characters, and SHALL hand the sync WHOOP's own refusal as `{ ok: false, status }`, while a failure with no status (no WHOOP tab, no captured Session) stays a failed read.

#### Scenario: WHOOP's refusal reaches the sync as before

- **GIVEN** WHOOP answers a read with 401
- **WHEN** the Connector reads it
- **THEN** the sync receives `{ ok: false, status: 401 }`
