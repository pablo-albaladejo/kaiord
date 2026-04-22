/**
 * Pure focus-rule helpers.
 *
 * Each rule is a single pure function: it takes a `Workout` + the ids
 * touched by a mutation and returns a `FocusTarget`. No React, no DOM,
 * no store reads — a CI grep enforces the purity constraint.
 *
 * Consumers (§6 action wiring) call these to compute what to put in
 * `pendingFocusTarget` after each mutation.
 */

export { createdItemTarget } from "./created-item";
export { nextAfterDelete } from "./next-after-delete";
export { nextAfterMultiDelete } from "./next-after-multi-delete";
export { preservedSelectionTarget } from "./preserved-selection";
export { restoredAfterUndoTarget } from "./restored-after-undo";
