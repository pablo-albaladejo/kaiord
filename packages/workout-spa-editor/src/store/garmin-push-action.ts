import { sendMessage } from "./garmin-extension-transport";
import type { GarminStore } from "./garmin-store";

type Set = (fn: Partial<GarminStore>) => void;
type Get = () => GarminStore;

const PUSH_TIMEOUT = 15_000;

const redetect = async (set: Set, get: Get) => {
  set({ lastDetectionTimestamp: null });
  await get().detectExtension();
};

export const createPushAction =
  (set: Set, get: Get, extensionId: string) => async (gcn: unknown) => {
    set({ pushing: { status: "loading" } });
    const res = await sendMessage(
      extensionId,
      { action: "push", gcn },
      PUSH_TIMEOUT
    );

    if (res.error === "Extension context invalidated") {
      await redetect(set, get);
      set({
        pushing: {
          status: "error",
          message: "Extension was updated. Please try again.",
        },
      });
      return;
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) await redetect(set, get);
      const message =
        res.error === "Extension did not respond"
          ? "Extension did not respond. Check Garmin Connect before retrying."
          : (res.error ?? "Push failed");
      set({ pushing: { status: "error", message } });
      return;
    }

    set({ pushing: { status: "success" } });
  };
