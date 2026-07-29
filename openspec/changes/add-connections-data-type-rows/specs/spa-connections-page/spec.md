## ADDED Requirements

### Requirement: A ranked source policy is never stored without its ranking

A ranked multi-source mode is meaningless without an order: the read resolver
consults the stored order and, finding nothing usable in it, resolves no record
at all, while every display surface is left to invent a winner. The system SHALL
persist a ranked policy only when EVERY source named in the request resolves to
a storage key, and SHALL otherwise report the refusal, naming the sources it
could not resolve, without writing anything.

Discarding the unresolvable names and storing the rest SHALL NOT be treated as
success: dropping a leading name promotes a source the request ranked BELOW it,
which the resolver then honours and every display surface then reports, so a
partial failure would silently invert the user's stated preference while
appearing to have worked.

#### Scenario: An order that resolves to nothing is refused

- **GIVEN** a request to set a ranked source policy naming only sources that do not resolve to a storage key
- **WHEN** the request is applied
- **THEN** no policy SHALL be persisted
- **AND** the caller SHALL be told the order could not be resolved

#### Scenario: A partially resolvable order is refused too

- **GIVEN** a request to set a ranked source policy whose first source does not resolve and whose second does
- **WHEN** the request is applied
- **THEN** no policy SHALL be persisted
- **AND** the second source SHALL NOT become the ranked first

#### Scenario: A fully resolvable order is stored

- **GIVEN** a request to set a ranked source policy in which every named source resolves
- **WHEN** the request is applied
- **THEN** the policy SHALL be persisted in the order requested

### Requirement: The section names where every managed data type comes from

The system SHALL present every managed data type as a row in one section beneath
the source cards, and SHALL derive the set of rows from the domain's own list of
managed types rather than from a hand-kept copy. Rows SHALL be presented in
named groups, and every managed type SHALL belong to exactly one group, so a
type added to the domain cannot render in no group at all.

Each row SHALL be addressable by a stable identifier derived from its data type,
and SHALL expose its derived origin as data rather than only as prose.

#### Scenario: Every managed type is rendered

- **WHEN** the section renders
- **THEN** every data type the domain manages SHALL appear exactly once

#### Scenario: A type the grouping does not cover fails loudly

- **GIVEN** a data type present in the domain's managed list and absent from every group
- **WHEN** the grouping is checked
- **THEN** the check SHALL fail rather than the type being omitted from the page

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
cannot disagree. Under the default unranked mode every source keeps writing and
nothing ranks them, so with two or more sources the system SHALL report HOW MANY
there are and SHALL NOT name one; naming one would present the order records
happened to be written in as a choice the user made.

#### Scenario: A type with no manual path and no route has no source

- **GIVEN** a data type with no enabled import route and no manual entry path
- **WHEN** its origin is derived
- **THEN** it SHALL report that it has no source

#### Scenario: Manual entry counts as a source

- **GIVEN** a data type with a manual entry path and no enabled import route
- **WHEN** its origin is derived
- **THEN** manual entry SHALL be named as its source

#### Scenario: The default unranked mode reports a count

- **GIVEN** a data type with two or more sources and no stored ranking
- **WHEN** its origin is derived
- **THEN** the row SHALL state how many sources it has
- **AND** SHALL NOT name any one of them

#### Scenario: A stored ranking is honoured

- **GIVEN** a data type with two or more sources and a stored ranked order
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

### Requirement: A row whose ranking cannot be honoured says so

Where a ranked order names none of the currently available sources the resolver
returns no record for that type at all — the data is not merely unranked, it is
not being read. The system SHALL distinguish this from the unranked default in
both its wording and its visual treatment, and SHALL NOT describe it with copy
that implies the sources are being kept side by side. This is the one state on
this read-only surface permitted to present itself as a problem.

#### Scenario: The stalled state is not described as healthy redundancy

- **GIVEN** a data type whose ranked order names no available source
- **WHEN** its row renders
- **THEN** the row SHALL state that nothing is being read for the type
- **AND** SHALL NOT reuse the wording given to a type whose sources are all kept

#### Scenario: A route the user switched off is not a source

- **GIVEN** an import route that exists but is disabled
- **WHEN** the origin is derived
- **THEN** that route's source SHALL NOT be counted

### Requirement: Freshness is attributed to the source, never to the data type

Stored sync freshness is recorded per (source, profile) and carries no data type.
The system SHALL therefore state freshness with the SOURCE as its subject, and
SHALL make it plain that the time describes everything that source sends rather
than the row it appears on. The system SHALL NOT claim that a particular data
type arrived at a particular time.

Where no single source owns a row, the system SHALL show no time rather than
choosing one of several arbitrarily. Where a source has recorded no sync at all —
including manual entry, which records none by design — the system SHALL show no
time rather than inventing one.

#### Scenario: The time names its source

- **GIVEN** a row whose single source has a recorded sync time
- **WHEN** the row renders
- **THEN** the sentence SHALL name that source as the subject of the time

#### Scenario: No owning source, no time

- **GIVEN** a row reporting a count of sources rather than a name
- **WHEN** the row renders
- **THEN** no sync time SHALL be shown

#### Scenario: A source that has never synced shows no time

- **GIVEN** a row whose source has no recorded sync
- **WHEN** the row renders
- **THEN** no sync time SHALL be shown

### Requirement: An export target is offered only where an export can exist

The system SHALL offer a row's "sent onwards" affordance only for data types the
registry gives an export capability. For a type with no export capability the
affordance SHALL be absent, because reporting that the type goes nowhere would
describe the absence of a route that cannot be created. For a type that can be
exported but has no enabled export route, the system SHALL report that it goes
nowhere, which there is true.

#### Scenario: An import-only type offers nothing

- **GIVEN** a data type with no export capability in the registry
- **WHEN** its row renders
- **THEN** no "sent onwards" affordance SHALL be present

#### Scenario: An exportable type with no enabled route says so

- **GIVEN** a data type with an export capability and no enabled export route
- **WHEN** its row renders
- **THEN** the row SHALL report that it is sent nowhere

### Requirement: The section claims no fallback and no transition date

No state records when a source stopped working or when another took over: the
fallback signal that exists is ranked-mode only, is scoped to a single day,
means "no record that day" rather than "this source broke", and does not cover
every type. The system SHALL NOT present a struck-through source, a "backup
since" date, a "stopped syncing" duration, or any other claim about a transition
between sources.

#### Scenario: No transition claim is rendered

- **WHEN** a row renders for a type with several sources
- **THEN** it SHALL NOT state that any source has been replaced, has fallen back, or has been a backup since some date
