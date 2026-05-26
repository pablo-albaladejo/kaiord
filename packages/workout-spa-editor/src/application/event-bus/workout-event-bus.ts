/**
 * Singleton workout event bus.
 *
 * Import `workoutEventBus` in production code to emit/subscribe to
 * workout lifecycle events. Tests inject a fresh `createEventBus()`
 * instance to avoid cross-test state leakage.
 */
import type { ManagedDataType } from "@kaiord/core";

import { createEventBus } from "./event-bus";

export type EntitySavedPayload = {
  kaiordRecordId: string;
  profileId: string;
  dataType: ManagedDataType;
  payload: Record<string, unknown>;
};

export type WorkoutEventMap = {
  entitySaved: EntitySavedPayload;
};

export const workoutEventBus = createEventBus<WorkoutEventMap>();
