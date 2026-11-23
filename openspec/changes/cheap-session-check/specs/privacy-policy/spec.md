## ADDED Requirements

### Requirement: Each extension section states what checking the connection costs

The Tanita, Train2Go, TrainingPeaks, Garmin and WHOOP sections of the privacy
policy SHALL state what a Session check sends and what it hands to the Kaiord
App, from what the code does: Tanita sends a `HEAD` of the export and
downloads no measurement; Train2Go asks who is signed in and passes on only
whether the athlete is, the profile and the coach's name and notes travelling
only to the connect flow and the popup; TrainingPeaks and Garmin send no
request and mint no token; the WHOOP identifier is returned only when the
Kaiord App is about to import. `check-privacy-policy` SHALL hold a rule for the
Tanita and TrainingPeaks checks, anchored to their sections, with the section
rule floors unchanged.

#### Scenario: The Tanita check stops being disclosed

- **WHEN** the Tanita section stops saying the check sends a `HEAD` that returns no measurement
- **THEN** `check-privacy-policy` SHALL fail on "Tanita session check by HEAD, downloading nothing, disclosed"

#### Scenario: The TrainingPeaks check stops being disclosed

- **WHEN** the TrainingPeaks section stops saying the check asks TrainingPeaks nothing and mints no token
- **THEN** `check-privacy-policy` SHALL fail on "TrainingPeaks connection check minting no token disclosed"
