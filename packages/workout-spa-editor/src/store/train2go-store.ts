/**
 * Train2Go Store
 *
 * Zustand store for Train2Go extension state. Transient data only —
 * nothing persisted to Dexie. Mirrors garmin-store pattern.
 */

import { create } from "zustand";

import { createTrain2GoActions } from "./train2go-store-actions";

const EXTENSION_ID: string = import.meta.env.VITE_TRAIN2GO_EXTENSION_ID || "";

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

  ...createTrain2GoActions(set, get, EXTENSION_ID),
}));
