/**
 * Train2Go Store
 *
 * Zustand store for Train2Go extension TRANSPORT state. After the
 * train2go-profile-link migration, this store holds only ephemeral
 * transport status — userId/userName/activities now live in the active
 * profile's linkedAccounts and the persisted coachingActivities table.
 */

import { create } from "zustand";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { createTrain2GoActions } from "./train2go-store-actions";

const getTrain2GoExtensionId = (): string =>
  bridgeDiscovery.getExtensionId("train2go-bridge") ?? "";

export type Train2GoStore = {
  extensionInstalled: boolean;
  sessionActive: boolean;
  loading: boolean;
  lastError: string | null;
  lastDetectionTimestamp: number | null;
  detectExtension: () => Promise<void>;
  openTrain2Go: () => Promise<void>;
};

export const useTrain2GoStore = create<Train2GoStore>((set, get) => ({
  extensionInstalled: false,
  sessionActive: false,
  loading: false,
  lastError: null,
  lastDetectionTimestamp: null,
  ...createTrain2GoActions(set, get, getTrain2GoExtensionId),
}));
