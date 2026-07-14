/**
 * WHOOP bridge read transport (Wave 1, extended Wave 5 with status reads).
 *
 * Relays a `{ action: "whoop-fetch", path }` message to the discovered
 * whoop-bridge extension and resolves with the relayed `{ ok, status, data }`
 * envelope. The session token stays inside the extension; this layer holds
 * none and only transports + validates the envelope. A bridge-level failure
 * (no session token captured, blocked origin, timeout) is surfaced as a typed
 * `WhoopBridgeError` carrying the bridge message so the sync use case persists
 * nothing. `readWhoopStatus` relays the extension's `status` action the same
 * way, so the sync trigger can gate on an active session before pulling.
 */
import { z } from "zod";

import type { WhoopFetchResult } from "../../application/whoop/whoop-fetch-result";
import { whoopFetchResultSchema } from "../../application/whoop/whoop-fetch-result";
import { sendBridgeMessage } from "./bridge-transport";

const WHOOP_FETCH_TIMEOUT_MS = 30_000;
const WHOOP_STATUS_TIMEOUT_MS = 5_000;

const whoopStatusSchema = z.object({
  connected: z.boolean(),
  userId: z.number().nullable(),
  // The extension stores `whoopCapturedAt: Date.now()` and returns it verbatim,
  // so this is an epoch-millis NUMBER (or null before a session is captured) —
  // NOT a string. Getting this wrong makes safeParse reject a real connected
  // envelope, which would throw in readWhoopStatus and silently kill the sync.
  capturedAt: z.number().nullable(),
});

export type WhoopStatus = z.infer<typeof whoopStatusSchema>;

export class WhoopBridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhoopBridgeError";
  }
}

export const readWhoopFetch = async (
  extensionId: string,
  path: string
): Promise<WhoopFetchResult> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "whoop-fetch", path },
    WHOOP_FETCH_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new WhoopBridgeError(res.error ?? "WHOOP bridge read failed");
  }
  const parsed = whoopFetchResultSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new WhoopBridgeError("Malformed WHOOP bridge response");
  }
  return parsed.data;
};

export const readWhoopStatus = async (
  extensionId: string
): Promise<WhoopStatus> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "status" },
    WHOOP_STATUS_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new WhoopBridgeError(res.error ?? "WHOOP status read failed");
  }
  const parsed = whoopStatusSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new WhoopBridgeError("Malformed WHOOP status response");
  }
  return parsed.data;
};
