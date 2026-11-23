/**
 * WHOOP bridge read transport (Wave 1, extended Wave 5 with status reads).
 *
 * Asks the discovered WHOOP Bridge for one read through `request`
 * (protocol 2), reading WHOOP's raw answer here (read-whoop-answer), or through
 * the legacy `whoop-fetch` (protocol 1), and resolves with the
 * `{ ok, status, data }` result the sync reads either way. The session token
 * stays inside the extension; this layer holds none. A bridge-level failure
 * (no session token captured, blocked origin, timeout) is surfaced as a typed
 * `WhoopBridgeError` carrying the bridge message so the sync use case persists
 * nothing. `readWhoopStatus` relays the extension's `status` action the same
 * way, so the sync trigger can gate on an active session before pulling.
 */
import { z } from "zod";

import { SESSION_OUTCOMES } from "../../../application/connections/session-outcome";
import type { WhoopFetchResult } from "../../../application/whoop/whoop-fetch-result";
import { whoopFetchResultSchema } from "../../../application/whoop/whoop-fetch-result";
import { sendBridgeMessage } from "../../bridge/bridge-transport";
import {
  answerOrThrow,
  callConnector,
  type ConnectorFailure,
} from "../../bridge/connector-call";
import { readWhoopAnswer, whoopRefusal } from "./read-whoop-answer";

const WHOOP_FETCH_TIMEOUT_MS = 30_000;
const WHOOP_STATUS_TIMEOUT_MS = 5_000;

// An extension with the cheap check answers `connected` and the typed
// `session` only; an older one also sends the WHOOP id and capture time.
const whoopStatusSchema = z.object({
  connected: z.boolean(),
  session: z.enum(SESSION_OUTCOMES).optional(),
  userId: z.number().nullable().optional(),
  // `whoopCapturedAt: Date.now()` verbatim: epoch millis (or null), NOT a
  // string — a string schema rejects a real envelope and kills the sync.
  capturedAt: z.number().nullable().optional(),
});

export type WhoopStatus = z.infer<typeof whoopStatusSchema>;

export class WhoopBridgeError extends Error {
  /** False when the extension never answered — it is gone, not signed out. */
  readonly delivered: boolean;
  constructor(message: string, delivered = true) {
    super(message);
    this.delivered = delivered;
    this.name = "WhoopBridgeError";
  }
}

const whoopError = (failure: ConnectorFailure): WhoopBridgeError =>
  new WhoopBridgeError(failure.message, failure.delivered);

export const readWhoopFetch = async (
  extensionId: string,
  path: string
): Promise<WhoopFetchResult> => {
  const res = await callConnector(
    extensionId,
    {
      method: "GET",
      path,
      legacy: { action: "whoop-fetch", path },
      read: readWhoopAnswer,
    },
    WHOOP_FETCH_TIMEOUT_MS
  );
  const refusal = whoopRefusal(res);
  if (refusal) return refusal;
  answerOrThrow(res, "WHOOP bridge read failed", whoopError);
  const parsed = whoopFetchResultSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new WhoopBridgeError("Malformed WHOOP bridge response");
  }
  return parsed.data;
};

export const readWhoopStatus = async (
  extensionId: string
): Promise<WhoopStatus> => {
  const res = answerOrThrow(
    await sendBridgeMessage(
      extensionId,
      { action: "status" },
      WHOOP_STATUS_TIMEOUT_MS
    ),
    "WHOOP status read failed",
    whoopError
  );
  const parsed = whoopStatusSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new WhoopBridgeError("Malformed WHOOP status response");
  }
  return parsed.data;
};
