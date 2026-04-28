/**
 * Train2Go Store Actions — TRANSPORT-only
 *
 * After train2go-profile-link, the store no longer owns activities or
 * userId/userName. Fetch use cases (syncWeek, expandDay) live in
 * application/coaching/* and run via useTrain2GoSource. Only detection
 * and "open the Train2Go tab" remain on the store surface.
 */

import { createDetectAction } from "./train2go-detect";
import { openTrain2Go } from "./train2go-extension-transport";
import type { Train2GoStore } from "./train2go-store";

type Set = (fn: Partial<Train2GoStore>) => void;
type Get = () => Train2GoStore;
type GetExtensionId = () => string;

const createOpenAction =
  (_set: Set, _get: Get, getExtensionId: GetExtensionId) => async () => {
    await openTrain2Go(getExtensionId());
  };

export const createTrain2GoActions = (
  set: Set,
  get: Get,
  getExtensionId: GetExtensionId
) => ({
  detectExtension: createDetectAction(set, get, getExtensionId),
  openTrain2Go: createOpenAction(set, get, getExtensionId),
});
