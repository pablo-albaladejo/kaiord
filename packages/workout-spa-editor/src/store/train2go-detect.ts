/**
 * Train2Go Extension Detection
 *
 * Heartbeat / boot / visibility-change ping that toggles transport
 * flags ONLY. MUST NOT mutate any profile's linkedAccounts — capturing
 * userId/userName from a ping response is restricted to the explicit
 * connect flow (application/coaching/attempt-link). A heartbeat after
 * disconnect must NOT silently re-link.
 */

import { ping } from "./train2go-extension-transport";
import type { Train2GoStore } from "./train2go-store";

type Set = (fn: Partial<Train2GoStore>) => void;
type Get = () => Train2GoStore;

const DETECTION_CACHE_MS = 30_000;
const SUPPORTED_PROTOCOLS = [1];

export const createDetectAction =
  (set: Set, get: Get, getExtensionId: () => string) => async () => {
    const extensionId = getExtensionId();
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

    // sessionActive is the ONLY data field we consume here.
    // userId / userName from `res` are ignored — they belong to the
    // explicit connect flow only (see attemptLink).
    set({
      extensionInstalled: true,
      sessionActive: res.sessionActive,
      lastError: null,
      lastDetectionTimestamp: now,
    });
  };
