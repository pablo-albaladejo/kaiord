## ADDED Requirements

### Requirement: A store extension is asked no check that costs

The Kaiord App SHALL NOT send a Session check to an extension whose check on
the protocol it speaks would download the athlete's data or mint a token.
For Garmin, TrainingPeaks and Tanita on protocol 1 it SHALL report the
Connection not checked without sending them anything; Tanita on protocol 2,
whose check is one `HEAD`, and Train2Go and WHOOP on either protocol are
checked. The protocol is the one discovery's verification answer carried.

#### Scenario: The store TrainingPeaks extension is not asked

- **GIVEN** Kaiord for TrainingPeaks answers on protocol 1
- **WHEN** the Connections page refreshes
- **THEN** no message is sent to it and its card says why it was not checked

#### Scenario: The new Tanita extension is checked

- **GIVEN** Kaiord for Tanita answers on protocol 2
- **WHEN** the Connections page refreshes
- **THEN** the App sends its `checkSession`
