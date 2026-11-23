## ADDED Requirements

### Requirement: Kaiord picks the Authority by itself

When more than one source reports the same kind of data and the athlete has no choice in force, the Kaiord App SHALL pick the Authority with one deterministic rule and SHALL NOT ask. What the athlete entered or imported themselves SHALL decide its day. Past that, the Platforms SHALL be read in a fixed order per kind: for weight and body composition Tanita, then TrainingPeaks, then Train2Go; for sleep, HRV, daily wellness, stress, strain, vitals and the heart-rate series WHOOP, then Garmin; for training zones Train2Go. Activities, planned sessions and Workouts SHALL have no Authority: every source's records SHALL be kept and shown. The rule SHALL only choose which stored record is read: no record of any source SHALL be deleted, overwritten or hidden by it, so a record from a source the order does not name, or whose import is off, SHALL still be read on a day no other source reported.

#### Scenario: A new athlete with two Platforms is never asked

- **GIVEN** a new athlete with TrainingPeaks and Tanita both sending weight
- **WHEN** both have reported a weight for the same day
- **THEN** Tanita's weight SHALL be read for that day
- **AND** no dialog, banner or question SHALL have asked which one decides

#### Scenario: The athlete's own entry wins its day

- **GIVEN** a weight from Tanita and a weight the athlete typed for the same day
- **WHEN** that day's weight is read
- **THEN** the typed weight SHALL be read

#### Scenario: A value from an unnamed source is still read

- **GIVEN** a day whose only weight comes from a source the order does not name
- **WHEN** that day's weight is read
- **THEN** that weight SHALL be read

### Requirement: When the Authority disconnects the next Platform decides

When the Authority Platform of a kind disconnects (its import is switched off), the next Platform of the kind's order whose import is on SHALL decide from then on. The disconnected Platform's records SHALL stay stored and SHALL still be read on a day no other source reported. Connecting it again SHALL make it the Authority again.

#### Scenario: Tanita disconnects

- **GIVEN** weight from TrainingPeaks and Tanita on the same day, and Tanita's import switched off by a Disconnect
- **WHEN** that day's weight is read
- **THEN** TrainingPeaks' weight SHALL be read

#### Scenario: Only the disconnected Platform reported

- **GIVEN** Tanita's import switched off, and a day only Tanita reported
- **WHEN** that day's weight is read
- **THEN** Tanita's weight SHALL be read

### Requirement: The Authority matrix is an advanced Capability, off by default

Choosing the Authority by hand SHALL be the Capability `authority-matrix`, graded advanced, owning the settings section `authority` and the assistant Tool `set_data_route`, and off for a new athlete. While it is on, a choice made in it (or through `set_data_route`) SHALL override the automatic rule for that kind, and "Automatic" SHALL hand the kind back to the rule. While it is off, its settings section, its link from Connections and its Tool SHALL be absent, and its stored choices SHALL be kept but SHALL NOT apply: the automatic rule decides every kind, and turning the Capability on again SHALL make the kept choices apply again. An athlete with a stored choice and no decision recorded SHALL read the Capability as on, so the update changes nothing they chose.

#### Scenario: The matrix appears only after activation

- **GIVEN** a new athlete
- **WHEN** they open Settings and Connections
- **THEN** no section or link to choose which Platform decides SHALL show
- **AND** the assistant SHALL NOT be offered `set_data_route`
- **WHEN** they turn "Choose which Platform decides" on in Settings, Capabilities
- **THEN** the section SHALL show each kind more than one source reports, with "Automatic" chosen

#### Scenario: A choice overrides the automatic one

- **GIVEN** the matrix on, and weight from TrainingPeaks and Tanita
- **WHEN** the athlete chooses TrainingPeaks for weight
- **THEN** TrainingPeaks' weight SHALL be read, and Connections SHALL name TrainingPeaks

#### Scenario: Off stops applying, on applies again

- **GIVEN** the athlete chose TrainingPeaks for weight
- **WHEN** they turn the matrix off
- **THEN** Tanita's weight SHALL be read and the choice SHALL still be stored
- **WHEN** they turn it on again
- **THEN** TrainingPeaks' weight SHALL be read

#### Scenario: An existing athlete keeps their choice

- **GIVEN** an athlete who chose an Authority before the update
- **WHEN** they open the updated App
- **THEN** the matrix SHALL be on and their choice SHALL apply

### Requirement: Nothing asks which Platform decides

No dialog, banner or prompt on connect, on sync or on the Connections page SHALL ask the athlete which Platform or which value decides. Where the App keeps the athlete's own value over a different one a Platform reports, it SHALL say so once for that set of values, with one action to take the Platform's instead, and SHALL ask nothing first.

#### Scenario: Train2Go reports a different FTP

- **GIVEN** an athlete who set their own FTP, and Train2Go reporting another
- **WHEN** the zones sync runs
- **THEN** no dialog SHALL open, the athlete's FTP SHALL stay
- **AND** one notice SHALL say Kaiord kept their thresholds, with "Use Train2Go's"
- **AND** the offer SHALL stay on the Athlete page after the notice is gone
