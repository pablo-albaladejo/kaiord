## ADDED Requirements

### Requirement: Nested step mutations are addressed by block id and block-local index

A step that lives inside a repetition block SHALL be addressed by the
pair (block id, position within that block's own `steps` array). Such a
mutation SHALL NOT be routed through a main-list action that resolves
its argument against the top-level `workout.steps` collection by the
`stepIndex` field, because the two index domains are unrelated and
collide silently.

The component that renders a repetition block SHALL NOT receive the
main-list step-delete callback, so a block-local index cannot reach it.

#### Scenario: Deleting a nested step removes that step

- **GIVEN** a workout with top-level steps and a repetition block containing two steps
- **WHEN** the user activates the delete affordance on the second step inside the block
- **THEN** that nested step SHALL be removed from the block

#### Scenario: Deleting a nested step leaves top-level steps untouched

- **GIVEN** a workout whose top-level list contains a step whose `stepIndex` equals the block-local position of a nested step
- **WHEN** the nested step is deleted
- **THEN** every top-level step SHALL remain present and unmodified

#### Scenario: Duplicating a nested step stays inside the block

- **GIVEN** a repetition block containing two steps
- **WHEN** the user duplicates the second step inside the block
- **THEN** the copy SHALL be inserted inside the same block and no top-level step SHALL change

#### Scenario: Unknown block id is a no-op

- **WHEN** a block-scoped step mutation names a block id that is not present in the workout
- **THEN** the store state SHALL be returned unchanged

#### Scenario: Out-of-range block-local index is a no-op

- **WHEN** a block-scoped step mutation names an index outside the block's `steps` bounds
- **THEN** the store state SHALL be returned unchanged

### Requirement: Emptying a repetition block removes the block

Deleting the last remaining step of a repetition block SHALL remove the
parent block in the same state update, consistent with the
`spa-editor-focus-management` requirement covering focus after that
delete. Top-level `stepIndex` values SHALL be recomputed so the
surviving main-list steps stay contiguous.

#### Scenario: Last nested step cascades to block removal

- **GIVEN** a repetition block containing exactly one step
- **WHEN** that step is deleted
- **THEN** the block SHALL no longer be present in the workout's step list

#### Scenario: Surviving top-level steps are reindexed

- **GIVEN** a workout where a repetition block precedes top-level steps
- **WHEN** the block is removed by the cascade
- **THEN** the remaining top-level steps SHALL carry contiguous zero-based `stepIndex` values

### Requirement: Nested deletes use the history snapshot rather than the delete trail

A block-scoped step delete SHALL NOT append to the `deletedSteps` undo
trail. That trail is replayed by restoring entries into the top-level
step list, so a nested entry would be reinstated in the wrong parent.
Reversal SHALL instead be served by the general undo-history snapshot,
as for every other in-block mutation. Consequently the nested delete
SHALL NOT be routed through the toast wrapper that reads that trail,
since it would otherwise offer an undo affordance bound to an unrelated
earlier deletion.

#### Scenario: Nested delete does not extend the delete trail

- **WHEN** a step inside a repetition block is deleted
- **THEN** the `deletedSteps` trail SHALL be unchanged

#### Scenario: Undo restores the nested step in its block

- **GIVEN** a step inside a repetition block has been deleted
- **WHEN** the user undoes the last action
- **THEN** the step SHALL be restored inside its original block
