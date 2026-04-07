import { sendMessage } from "./garmin-extension-transport";
import type { GarminStore } from "./garmin-store";

type Set = (fn: Partial<GarminStore>) => void;
type Get = () => GarminStore;

const LIST_TIMEOUT = 10_000;

const redetect = async (set: Set, get: Get) => {
  set({ lastDetectionTimestamp: null });
  await get().detectExtension();
};

export const createListAction =
  (set: Set, get: Get, extensionId: string) => async (): Promise<unknown[]> => {
    const res = await sendMessage(
      extensionId,
      { action: "list" },
      LIST_TIMEOUT
    );

    if (res.error === "Extension context invalidated") {
      await redetect(set, get);
      throw new Error("Extension was updated. Please try again.");
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) await redetect(set, get);
      throw new Error(res.error ?? "List failed");
    }

    return res.data as unknown[];
  };
