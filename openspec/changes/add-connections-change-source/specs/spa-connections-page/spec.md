## ADDED Requirements

### Requirement: A row offers its source of truth to be changed only where that is a choice

The system SHALL offer a source-of-truth control on a data type's row when the
type has two or more sources it can be read from, or when a ranking is already
stored for it. It SHALL NOT offer one where the type has a single source under
the default unranked mode, because there is no second way to read it and the
control could only change the stored semantics without changing what is read.

A ranking already stored SHALL keep the control present as sources drop away, so
a type can always be returned to the default from the place it left it — down to
the last source, but no further: with no source at all there is nothing to pick,
nothing to keep, and no difference between the two modes, so the system SHALL NOT
offer a control there whatever mode is stored.

#### Scenario: A single-source type under the default mode offers no control

- **GIVEN** a data type with exactly one source and no stored ranking
- **WHEN** its row renders
- **THEN** no source-of-truth control SHALL be offered

#### Scenario: A ranked type keeps the control after losing a source

- **GIVEN** a data type with a stored ranking and only one source left
- **WHEN** its row renders
- **THEN** the control SHALL still be offered

#### Scenario: A ranked type with no source left offers no control

- **GIVEN** a data type with a stored ranking and no source at all
- **WHEN** its row renders
- **THEN** no source-of-truth control SHALL be offered

### Requirement: The change of read semantics is stated before it is made

Choosing a source of truth stores a ranked mode, which changes how the type is
READ: instead of keeping every source's record, the system consults the order and
reads the first source with a record. That consequence SHALL be presented on the
row, in terms of the row's own data type, before any control that would cause it
can be operated, and opening the control SHALL store nothing.

The statement SHALL describe both what the type does now and what picking would
change, and SHALL state that the change can be undone from the same place. A
requirement that can be satisfied while surprising the user is not satisfied.

Where a ranking is already stored, picking again only changes which source leads
and no read semantics change; the system SHALL NOT repeat the consequence
statement there, because a warning attached to a state it does not apply to
trains the reader to ignore it where it does.

#### Scenario: An unranked row explains the consequence before it happens

- **GIVEN** a data type with two or more sources and no stored ranking
- **WHEN** its source-of-truth control is opened
- **THEN** the row SHALL state that every source is currently kept with none ranked
- **AND** SHALL state that picking one will make the type be read from it first
- **AND** SHALL state that the choice can be undone from the same place
- **AND** no policy SHALL have been stored

#### Scenario: An already-ranked row is not warned about a change it cannot make

- **GIVEN** a data type with a stored ranking
- **WHEN** its source-of-truth control is opened
- **THEN** the row SHALL state which source it is read from today
- **AND** SHALL NOT present the consequence statement given to an unranked row

### Requirement: Returning a type to keeping every source is as reachable as leaving it

The system SHALL offer "keep every source" among the choices on every row that
offers the control, and SHALL present it as a peer of the sources rather than
behind a further step. Choosing it SHALL store the default unranked mode AND
discard the stored order, so a ranking cannot decide the type again the moment
the mode changes back.

#### Scenario: A ranked type can be returned to the default in one action

- **GIVEN** a data type with a stored ranked order
- **WHEN** "keep every source" is chosen
- **THEN** the unranked mode SHALL be stored
- **AND** the stored order SHALL be emptied

### Requirement: A source is offered only where it can serve the type

The system SHALL offer as a source of truth only sources the type is actually
read from, and only those able to serve it. An enabled import route whose bridge
does not support the route, or does not announce the capability the type
requires, SHALL NOT be offered — ranking it first would name a source that can
never produce a record.

A bridge whose capabilities are not yet known SHALL NOT be treated as unable:
absence of an answer is not a negative answer, and a source whose extension is
not running still owns the records the read resolver returns.

#### Scenario: An incapable but enabled route is not offered

- **GIVEN** an enabled import route whose bridge announces no capability for that data type
- **WHEN** the row's choices are derived
- **THEN** that source SHALL NOT be among them

#### Scenario: An unverified bridge stays offerable

- **GIVEN** an enabled import route whose bridge has announced no capabilities yet
- **WHEN** the row's choices are derived
- **THEN** that source SHALL still be among them

### Requirement: What is stored is what the reader resolves

The stored order SHALL begin with the source that was picked and SHALL retain
every other source the row can be read from, in their previous relative order, so
they remain ranked fallbacks rather than being dropped from a type they can still
serve. The source named by the row after the write SHALL be the source that was
picked.

A ranked order that resolves to no source SHALL NOT be stored. The control SHALL
achieve this by construction — it composes the order from the sources it offered,
and is not offered where there is none — rather than by rejecting a request it
cannot produce.

#### Scenario: The picked source leads and the others follow

- **GIVEN** a data type read from several sources
- **WHEN** one of them is picked as the source of truth
- **THEN** the stored order SHALL begin with it
- **AND** SHALL still contain every other source the type is read from

#### Scenario: A previous ranking survives beneath a new pick

- **GIVEN** a data type with a stored ranked order
- **WHEN** a different source is picked
- **THEN** the previously ranked sources SHALL keep their relative order behind it

#### Scenario: The row names the source that was picked

- **GIVEN** a source picked as the source of truth
- **WHEN** the row's origin is derived from what was stored
- **THEN** it SHALL name that source
