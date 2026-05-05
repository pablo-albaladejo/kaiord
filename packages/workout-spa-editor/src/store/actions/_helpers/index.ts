/**
 * Shared helpers for repetition-block / step mutation actions.
 *
 * These helpers extract the recurring KRD-extraction / KRD-rebuild /
 * single-block-replacement patterns that previously appeared
 * verbatim across every repetition-block action file. They are
 * intentionally thin pure-functional wrappers — no side effects, no
 * focus or selection logic — so each action can compose them in its
 * own focus / undo flow.
 */

export { buildKrdWithWorkout } from "./build-krd-with-workout";
export { extractStructuredWorkout } from "./extract-workout";
export { replaceBlockAtPosition } from "./replace-block-at-position";
