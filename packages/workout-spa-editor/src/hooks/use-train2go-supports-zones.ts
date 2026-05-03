/**
 * Reactive view of "is the discovered Train2Go bridge advertising
 * `read:training-zones` in its verified manifest?".
 *
 * The Sync-zones toggle gates on this — older bridges that ship only
 * `read:training-plan` get no toggle, so users never see a feature
 * their installed extension cannot fulfil.
 */
import { useSyncExternalStore } from "react";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";

const TRAIN2GO_BRIDGE_ID = "train2go-bridge";
const READ_TRAINING_ZONES = "read:training-zones";

const snapshot = (): boolean =>
  bridgeDiscovery
    .getCapabilities(TRAIN2GO_BRIDGE_ID)
    ?.includes(READ_TRAINING_ZONES) ?? false;

export const useTrain2GoSupportsZones = (): boolean =>
  useSyncExternalStore(
    (cb) => bridgeDiscovery.subscribe(cb),
    snapshot,
    () => false
  );
