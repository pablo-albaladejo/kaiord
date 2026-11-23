## ADDED Requirements

### Requirement: The thin Bridges' answers are disclosed as handed over unread

The Garmin, TrainingPeaks and WHOOP sections of the privacy policy SHALL say that the extension hands the Platform's answer to the Kaiord App as it came, without reading it; the Garmin section SHALL say its calendar read is filtered in the Kaiord App, in the athlete's browser; and the TrainingPeaks section SHALL say the Kaiord App keeps only a workout's id and day of a workout read. `check-privacy-policy.mjs` SHALL pin each with a rule.

#### Scenario: A Garmin section saying the extension filters the calendar fails

- **GIVEN** the Garmin section says the read is filtered inside the extension's service worker
- **WHEN** the policy guard runs
- **THEN** it fails on "Garmin calendar read filtered on the device"
