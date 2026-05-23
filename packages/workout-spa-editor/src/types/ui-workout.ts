/**
 * UIWorkout and UIItem types.
 *
 * `UIWorkout` is the in-memory shape the editor operates on. It mirrors the
 * portable `KRD` shape but carries an `ItemId` on every step and block so
 * focus and selection can reference items by stable identity across
 * reorders, undo/redo, and delete+undo. IDs are stripped before any export
 * via `stripIds` and regenerated on every load.
 */

import type { RepetitionBlock, Workout, WorkoutStep } from "@kaiord/core";

import type { ItemId } from "../store/providers/item-id";
import type { KRD } from "./krd-core";

export type UIWorkoutStep = WorkoutStep & {
  id: ItemId;
};

export type UIRepetitionBlock = Omit<RepetitionBlock, "id" | "steps"> & {
  id: ItemId;
  steps: Array<UIWorkoutStep>;
};

export type UIWorkoutItem = UIWorkoutStep | UIRepetitionBlock;

export type UIWorkoutInner = Omit<Workout, "steps"> & {
  steps: Array<UIWorkoutItem>;
};

/**
 * In-memory workout shape.
 *
 * Structurally a `KRD` with the guarantee — enforced at the type level —
 * that `extensions.structured_workout` (if present) conforms to
 * `UIWorkoutInner` and therefore carries stable `ItemId`s on every step
 * and block. Other extension namespaces (e.g. `extensions.health`) pass
 * through unchanged as `unknown`, matching the KRD v2.0 catch-all shape.
 * The `stripIds` chokepoint enforces the portable `KRD` shape before
 * serialisation.
 */
// KRD v2.0 widened `extensions` to a `.catchall(z.unknown())` tagged
// object so unknown adapter namespaces round-trip. That index
// signature is incompatible with narrowing a single named key —
// every key in the resulting type ends up as `unknown`. We keep the
// runtime guarantee (every `structured_workout` produced by
// `hydrateUIWorkout` carries `ItemId`s, every outbound path goes
// through `stripIds`) but accept `extensions` at the KRD shape on
// the type level; readers cast to `UIWorkoutInner` at the use site.
export type UIWorkout = KRD;
