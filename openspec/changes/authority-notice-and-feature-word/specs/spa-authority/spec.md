## ADDED Requirements

### Requirement: One notice when the Authority changes

The first time a Platform the athlete connected starts deciding a kind of health data that another Platform was already deciding, the Kaiord App SHALL show one notice naming the new Platform, the kind and the consequence ("Tanita now decides: Weight. Days only TrainingPeaks reported don't change.", in English and Spanish) with one link to where it can be changed: the kind's row on Connections, or the matrix while it is on. It SHALL NOT open a dialog or ask anything. It SHALL be shown once per kind and new Authority, remembered on the athlete (so another device SHALL NOT repeat it), and SHALL NOT be shown for a kind's first Platform, for a Platform deciding again after a disconnect, or for a Platform the athlete chose in the matrix. Activities, planned sessions, Workouts and Training Zones, which are not health data, SHALL never raise it. The kind is named by its label on Connections.

#### Scenario: Tanita after months of TrainingPeaks weight

- **GIVEN** an athlete whose weight TrainingPeaks decided
- **WHEN** they connect Tanita, which sends weight
- **THEN** one notice SHALL say "Tanita now decides: Weight. Days only TrainingPeaks reported don't change." with a link to the weight row on Connections
- **AND** no dialog SHALL open
- **AND** a reload, or another device of the same athlete, SHALL NOT show it again

#### Scenario: The athlete chose Tanita

- **GIVEN** the matrix on and the athlete's choice of Tanita for weight
- **WHEN** Tanita starts sending weight
- **THEN** no notice SHALL be shown
