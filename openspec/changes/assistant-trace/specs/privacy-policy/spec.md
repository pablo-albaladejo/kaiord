## ADDED Requirements

### Requirement: The policy discloses the assistant's Traces

The privacy policy SHALL state that each run of the Kaiord App's assistant leaves a Trace in the athlete's browser, what it holds and does not hold, that Traces are never sent anywhere and are left out of the sync snapshot and of a backup file, how many are kept and for how long, and that Settings, Privacy lists, exports and deletes them. `check-privacy-policy.mjs` SHALL fail when the disclosure is missing.

#### Scenario: Disclosure removed

- **WHEN** the policy no longer says that Traces are never sent anywhere
- **THEN** the privacy-policy check SHALL fail on that rule alone

### Requirement: The policy discloses that the usage log stays on the device

The privacy policy SHALL state what the assistant's usage log holds per run, that it stays on the device (never sent, left out of the sync snapshot and of a backup file, naming no Trace) and how long runs are kept. `check-privacy-policy.mjs` SHALL fail when the disclosure is missing.

#### Scenario: Usage log disclosure removed

- **WHEN** the policy no longer says that the usage log stays on this device
- **THEN** the privacy-policy check SHALL fail on that rule alone
