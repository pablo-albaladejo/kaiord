import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { HydrationStatus } from "../adapters/dexie/storage-probe";
import { probeStorage } from "../adapters/dexie/storage-probe";

export type StorageStatus = "checking" | "ok" | "failed";

export type StorageStoreState = {
  status: StorageStatus;
  probe: () => Promise<void>;
};

type Deps = {
  probe: () => Promise<HydrationStatus>;
};

export function createStorageStore(deps: Deps) {
  let inflight: Promise<void> | null = null;

  return createStore<StorageStoreState>((set, get) => ({
    status: "checking",
    probe: async () => {
      if (get().status !== "checking") return;
      if (inflight) return inflight;

      inflight = (async () => {
        try {
          const result = await deps.probe();
          set({ status: result === "complete" ? "ok" : "failed" });
        } catch {
          set({ status: "failed" });
        }
      })();

      try {
        await inflight;
      } finally {
        inflight = null;
      }
    },
  }));
}

export const storageStore = createStorageStore({ probe: probeStorage });

export const useStorageStore = <T>(selector: (s: StorageStoreState) => T): T =>
  useStore(storageStore, selector);
