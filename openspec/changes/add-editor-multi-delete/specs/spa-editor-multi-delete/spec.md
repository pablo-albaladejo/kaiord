## ADDED Requirements

### Requirement: Bulk delete of a main-list multi-selection

The editor SHALL delete every top-level step addressed by a multi-selection in a
single state update. The removal SHALL filter the step list exactly once and
reindex exactly once, so that the set of removed steps is precisely the selected
set. Indices addressing no step SHALL be ignored, and an empty selection SHALL
leave the workout, the history, and the undo trail untouched.

#### Scenario: A non-contiguous selection removes exactly the selected steps

- **GIVEN** a main list of five steps whose `stepIndex` values are 0 through 4
- **WHEN** the steps at `stepIndex` 1 and 3 are bulk-deleted
- **THEN** exactly those two steps SHALL be removed
- **AND** the three survivors SHALL be the original steps 0, 2 and 4, in that order

#### Scenario: Survivors are reindexed into a dense range

- **GIVEN** a main list of five steps
- **WHEN** two of them are bulk-deleted
- **THEN** the surviving steps SHALL carry `stepIndex` 0, 1 and 2

#### Scenario: Unmatched indices are ignored

- **GIVEN** a main list of five steps
- **WHEN** a bulk delete addresses `stepIndex` 1 and a `stepIndex` that matches no step
- **THEN** only the step at `stepIndex` 1 SHALL be removed

#### Scenario: An empty selection is inert

- **WHEN** a bulk delete is invoked with no indices
- **THEN** the workout SHALL be unchanged
- **AND** no history snapshot SHALL be pushed

### Requirement: A bulk delete is one undoable operation

A bulk delete SHALL push exactly one history snapshot, so a single undo command
reverses the whole operation rather than one step per removed item.

#### Scenario: One history snapshot per bulk delete

- **GIVEN** a loaded workout at a known history index
- **WHEN** three steps are bulk-deleted in one operation
- **THEN** the history index SHALL advance by exactly one

### Requirement: Delete-undo entries are keyed by a stable group identity

Every entry in the delete-undo trail SHALL carry a `groupId` identifying the
delete _operation_ that produced it. A bulk delete SHALL emit one entry per
removed item, all sharing a single `groupId`; a single-step delete SHALL emit one
entry that is a group of one. The `groupId` SHALL NOT be derived from a clock
read, because deletes occurring within the same millisecond would collide and an
undo keyed on the colliding value would restore one entry and silently discard
the rest. The `timestamp` field SHALL be retained solely for the expiry sweep.

#### Scenario: Two deletes in the same millisecond stay distinct

- **WHEN** two delete operations complete within the same millisecond
- **THEN** each SHALL carry a distinct `groupId`
- **AND** undoing one SHALL leave the other's entry in the trail

#### Scenario: Undo targets only the addressed group

- **GIVEN** two delete operations recorded in the trail
- **WHEN** undo is invoked with the second operation's `groupId`
- **THEN** only that operation's items SHALL be restored

### Requirement: Grouped undo restores every item of its operation

Undoing a delete group SHALL restore all of that group's items to their original
absolute positions, and SHALL remove the entire group from the trail in one
action. Items SHALL be re-inserted in ascending original-index order, because
each stored index refers to a position in the pre-delete list and an earlier item
must be back in place before a later one is inserted.

#### Scenario: One undo restores every step of a bulk delete

- **GIVEN** two steps removed by a single bulk delete
- **WHEN** undo is invoked once with that operation's `groupId`
- **THEN** both steps SHALL be restored at their original positions

#### Scenario: A non-contiguous group is restored in order

- **GIVEN** the steps at positions 0, 2 and 4 removed by one bulk delete
- **WHEN** the operation is undone
- **THEN** the list SHALL be identical to its pre-delete state

#### Scenario: The whole group leaves the trail together

- **GIVEN** a bulk delete that recorded several entries under one `groupId`
- **WHEN** that group is undone
- **THEN** no entry of that group SHALL remain in the trail

### Requirement: Delete is enabled for a main-list multi-selection

The `canDelete` guard and the delete command SHALL consult `selectedStepIds`, not
only the scalar `selectedStepId`. Because a multi-selection is definitionally
`selectedStepId === null`, a guard reading only the scalar reports `false` for
every multi-selection — including a selection of exactly one toggled step — and
the command silently no-ops. Delete SHALL be enabled when every selected id
resolves to a top-level step, and SHALL remain disabled when the selection
resolves inside a repetition block, since nested steps are addressed by block id
rather than by main-list `stepIndex`.

#### Scenario: Several selected top-level steps enable delete

- **GIVEN** two top-level steps are selected and the scalar selection is null
- **WHEN** the command guards are computed
- **THEN** `canDelete` SHALL be true

#### Scenario: A single toggle-selected step enables delete

- **GIVEN** exactly one top-level step is selected via toggle and the scalar selection is null
- **WHEN** the command guards are computed
- **THEN** `canDelete` SHALL be true

#### Scenario: A selection inside a repetition block does not enable main-list delete

- **GIVEN** the selection resolves to a step nested inside a repetition block
- **WHEN** the command guards are computed
- **THEN** `canDelete` SHALL be false

#### Scenario: An empty selection does not enable delete

- **WHEN** neither the scalar selection nor the selection array identifies a step
- **THEN** `canDelete` SHALL be false
