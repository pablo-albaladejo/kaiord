import { createDetectAction } from "./garmin-detect";
import { createListAction } from "./garmin-list-action";
import { createPushAction } from "./garmin-push-action";
import type { GarminStore } from "./garmin-store";

type Set = (fn: Partial<GarminStore>) => void;
type Get = () => GarminStore;

export const createGarminActions = (
  set: Set,
  get: Get,
  extensionId: string
) => ({
  detectExtension: createDetectAction(set, get, extensionId),
  pushWorkout: createPushAction(set, get, extensionId),
  listWorkouts: createListAction(set, get, extensionId),
});
