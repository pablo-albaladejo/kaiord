/**
 * WHOOP bridge read transport (Wave 1).
 *
 * Relays a `{ action: "whoop-fetch", path }` message to the discovered
 * whoop-bridge extension and resolves with the relayed `{ ok, status, data }`
 * envelope. The session token stays inside the extension; this layer holds
 * none and only transports + validates the envelope. A bridge-level failure
 * (no session token captured, blocked origin, timeout) is surfaced as a typed
 * `WhoopBridgeError` carrying the bridge message so the sync use case persists
 * nothing.
 */
import type { WhoopFetchResult } from "../../application/whoop/whoop-fetch-result";
import { whoopFetchResultSchema } from "../../application/whoop/whoop-fetch-result";
import { sendBridgeMessage } from "./bridge-transport";

const WHOOP_FETCH_TIMEOUT_MS = 30_000;

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
