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
 * and block. A plain `KRD` coming from a port is not assignable here;
 * `hydrateUIWorkout` is the only supported way to obtain one, and the
 * `stripIds` chokepoint enforces the portable `KRD` shape before
 * serialisation.
 */
export type UIWorkout = Omit<KRD, "extensions"> & {
  extensions?: {
    structured_workout?: UIWorkoutInner;
  };
};
