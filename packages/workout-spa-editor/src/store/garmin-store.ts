import { create } from "zustand";

import { createGarminActions } from "./garmin-store-actions";

const EXTENSION_ID: string = import.meta.env.VITE_GARMIN_EXTENSION_ID || "";

type PushState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success" };

export type GarminStore = {
  extensionInstalled: boolean;
  sessionActive: boolean;
  pushing: PushState;
  lastError: string | null;
  lastDetectionTimestamp: number | null;
  detectExtension: () => Promise<void>;
  pushWorkout: (gcn: unknown) => Promise<void>;
  listWorkouts: () => Promise<unknown[]>;
  setPushing: (state: PushState) => void;
};

export const useGarminStore = create<GarminStore>((set, get) => ({
  extensionInstalled: false,
  sessionActive: false,
  pushing: { status: "idle" },
  lastError: null,
  lastDetectionTimestamp: null,

  ...createGarminActions(set, get, EXTENSION_ID),

  setPushing: (pushing) => set({ pushing }),
}));
