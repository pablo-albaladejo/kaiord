## MODIFIED Requirements

### Requirement: A source is named only when one source is real

The system SHALL derive a row's origin from the profile's enabled import routes
for that type, together with manual entry for the types that have a manual entry
path. With no source it SHALL say so. With exactly one source it SHALL name that
source.

The stored multi-source mode SHALL be consulted whatever the number of sources,
including one: a ranked order that excludes the lone available source makes the
resolver read nothing, so naming that source would attribute the type to data
that never surfaces. Under a ranked mode the system SHALL name the first source
of the effective order — the same one the read resolver consults — so the two
cannot disagree. With no choice in force (none stored, or the Authority matrix
Capability off) and two or more sources, a kind the App picks an Authority for
SHALL name the Platform the automatic rule picks, the one the read resolver
consults when the athlete entered nothing that day, and SHALL say that Kaiord
chose it. A kind with no Authority, or a stored choice to keep every source,
keeps every source's records and nothing ranks them, so with two or more
sources the system SHALL report HOW MANY there are and SHALL NOT name one.

#### Scenario: A type with no manual path and no route has no source

- **GIVEN** a data type with no enabled import route and no manual entry path
- **WHEN** its origin is derived
- **THEN** it SHALL report that it has no source

#### Scenario: Manual entry counts as a source

- **GIVEN** a data type with a manual entry path and no enabled import route
- **WHEN** its origin is derived
- **THEN** manual entry SHALL be named as its source

#### Scenario: Nobody chose, and the App names its Authority

- **GIVEN** weight reported by TrainingPeaks and Tanita, and no choice in force
- **WHEN** its origin is derived
- **THEN** the row SHALL name Tanita
- **AND** SHALL say that Kaiord chose it

#### Scenario: The default unranked mode reports a count

- **GIVEN** Activities with two or more sources, or a stored choice to keep every source
- **WHEN** its origin is derived
- **THEN** the row SHALL state how many sources it has
- **AND** SHALL NOT name any one of them

#### Scenario: A stored ranking is honoured

- **GIVEN** a data type with two or more sources and a stored ranked order, and the Authority matrix not turned off
- **WHEN** its origin is derived
- **THEN** the row SHALL name the first source of that order

#### Scenario: A ranked mode that ranks nothing names nothing

- **GIVEN** a data type in a ranked mode whose stored order names none of its currently available sources
- **WHEN** its origin is derived
- **THEN** the row SHALL report that it has no usable source
- **AND** SHALL NOT fall back to whichever source happens to be first

#### Scenario: A ranked order that excludes the only source

- **GIVEN** a data type with exactly one available source and a stored ranked order that does not include it
- **WHEN** its origin is derived
- **THEN** the row SHALL report that it has no usable source rather than naming that source

## REMOVED Requirements

### Requirement: A row offers its source of truth to be changed only where that is a choice

**Reason**: The Connections page no longer asks which source decides a kind: the App decides (#1666). Choosing lives only in the Authority matrix, an advanced Capability, which keeps the same offer rule.

**Migration**: see `spa-authority`, "The Authority matrix is an advanced Capability, off by default".

### Requirement: The change of read semantics is stated before it is made

**Reason**: A choice no longer changes what a kind does by surprise: with no choice the App already reads one Authority, and the matrix states what decides each kind before any button.

**Migration**: see `spa-authority`, "The Authority matrix is an advanced Capability, off by default".

### Requirement: Returning a type to keeping every source is as reachable as leaving it

**Reason**: "Keep every source" is no longer the default to return to; the matrix offers "Automatic", which hands the kind back to the App, first and always.

**Migration**: see `spa-authority`, "The Authority matrix is an advanced Capability, off by default".
