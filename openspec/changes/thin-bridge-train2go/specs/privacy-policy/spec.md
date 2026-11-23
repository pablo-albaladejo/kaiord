## ADDED Requirements

### Requirement: Kaiord for Train2Go section says answers reach the Kaiord App unread

The `Kaiord for Train2Go Extension` section SHALL state that the Kaiord App names the method and path of each request and that the extension hands it Train2Go's answer as it came, without reading it, and SHALL state that the Kaiord App keeps only the zones and weight from the profile page and drops the rest of it in the browser. `packages/docs/scripts/check-privacy-policy.mjs` SHALL require both inside that section, and its Train2Go rule floor SHALL be 12.

#### Scenario: The unread hand-over is disclosed

- **WHEN** the privacy-policy check runs
- **THEN** it finds "hands it Train2Go's answer as it came, without reading it" inside the Train2Go section

#### Scenario: The App's allowlist is disclosed

- **WHEN** the privacy-policy check runs
- **THEN** it finds "which keeps only your heart-rate, power and pace zones per sport, your maximum and resting heart rate, and your weight" inside the Train2Go section
