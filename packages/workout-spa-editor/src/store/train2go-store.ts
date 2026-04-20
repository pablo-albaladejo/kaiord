/**
 * Train2Go Store
 *
 * Zustand store for Train2Go extension state. Transient data only —
 * nothing persisted to Dexie. Mirrors garmin-store pattern.
 */

import { create } from "zustand";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import { createTrain2GoActions } from "./train2go-store-actions";

const getTrain2GoExtensionId = (): string =>
  bridgeDiscovery.getExtensionId("train2go-bridge") ?? "";

export type Train2GoActivity = {
  id: number;
  date: string;
  sport: string;
  title: string;
  duration: string;
  workload: number;
  status: number;
  description?: string;
  completion?: number;
};

export type Train2GoStore = {
  extensionInstalled: boolean;
  sessionActive: boolean;
  userId: number | null;
  userName: string | null;
  loading: boolean;
  lastError: string | null;
  lastDetectionTimestamp: number | null;
  activities: Train2GoActivity[];
  detectExtension: () => Promise<void>;
  fetchWeek: (date: string) => Promise<void>;
  fetchDay: (date: string) => Promise<void>;
  openTrain2Go: () => Promise<void>;
};

export const useTrain2GoStore = create<Train2GoStore>((set, get) => ({
  extensionInstalled: false,
  sessionActive: false,
  userId: null,
  userName: null,
  loading: false,
  lastError: null,
  lastDetectionTimestamp: null,
  activities: [],

  ...createTrain2GoActions(set, get, getTrain2GoExtensionId),
}));
