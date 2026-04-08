import { ping } from "./garmin-extension-transport";
import type { GarminStore } from "./garmin-store";

type Set = (fn: Partial<GarminStore>) => void;
type Get = () => GarminStore;

const DETECTION_CACHE_MS = 30_000;
const SUPPORTED_PROTOCOLS = [1];

export const createDetectAction =
  (set: Set, get: Get, extensionId: string) => async () => {
    const { lastDetectionTimestamp, extensionInstalled } = get();
    const now = Date.now();
    if (
      lastDetectionTimestamp &&
      extensionInstalled &&
      now - lastDetectionTimestamp < DETECTION_CACHE_MS
    ) {
      return;
    }

    const res = await ping(extensionId);

    if (!res.ok) {
      set({
        extensionInstalled: false,
        sessionActive: false,
        lastError: null,
        lastDetectionTimestamp: now,
      });
      return;
    }

    if (
      !res.protocolVersion ||
      !SUPPORTED_PROTOCOLS.includes(res.protocolVersion)
    ) {
      set({
        extensionInstalled: true,
        sessionActive: false,
        lastError: "Update your Kaiord Garmin Bridge extension",
        lastDetectionTimestamp: now,
      });
      return;
    }

    set({
      extensionInstalled: true,
      sessionActive: res.data?.gcApi?.ok === true,
      lastError: null,
      lastDetectionTimestamp: now,
    });
  };
