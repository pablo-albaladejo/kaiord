/**
 * Train2Go Extension Detection
 *
 * Detects Train2Go Bridge extension via ping. Mirrors garmin-detect.
 */

import { ping } from "./train2go-extension-transport";
import type { Train2GoStore } from "./train2go-store";

type Set = (fn: Partial<Train2GoStore>) => void;
type Get = () => Train2GoStore;

const DETECTION_CACHE_MS = 30_000;
const SUPPORTED_PROTOCOLS = [1];

export const createDetectAction =
  (set: Set, get: Get, extensionId: string) => async () => {
    if (!extensionId) return;

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
        userId: null,
        userName: null,
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
        lastError: "Update your Kaiord Train2Go Bridge extension",
        lastDetectionTimestamp: now,
      });
      return;
    }

    set({
      extensionInstalled: true,
      sessionActive: res.data?.sessionActive === true,
      userId: res.data?.userId ?? null,
      userName: res.data?.userName ?? null,
      lastError: null,
      lastDetectionTimestamp: now,
    });
  };
