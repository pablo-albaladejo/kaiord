/**
 * WHOOP's Session check: its `status` reads the extension's own storage and
 * asks WHOOP nothing. A held sign-in may still be unable to serve: its token
 * names no account id (`custom:user_id`), or no WHOOP tab is open to read
 * through. The current extension says both as yes or no in the same answer
 * (`hasAccountId`, `tabOpen`); the one a protocol behind says the first in
 * `status` (`userId: null`) and cannot say the second. No id is asked for.
 */
import type { ConnectionReason } from "@kaiord/i18n/connection-notices";

import { classifyEnvelope } from "./bridge-envelope-classify";
import { readWhoopSession } from "./bridge-legacy-session-readers";
import type { SessionProber } from "./bridge-session-probe-types";
import { type ExtensionResponse, sendBridgeMessage } from "./bridge-transport";
import { speaksPreviousProtocol } from "./thin-bridge-request";

const STATUS_TIMEOUT_MS = 5_000;

type WhoopCheck = {
  userId?: unknown;
  hasAccountId?: unknown;
  tabOpen?: unknown;
};

const reasonOf = (status: ExtensionResponse): ConnectionReason | null => {
  const data = (status.data ?? {}) as WhoopCheck;
  if (speaksPreviousProtocol(status)) {
    return data.userId == null ? "no-account-id" : null;
  }
  if (data.hasAccountId === false) return "no-account-id";
  return data.tabOpen === false ? "no-tab" : null;
};

export const probeWhoopSession: SessionProber = async (extensionId) => {
  const status = await sendBridgeMessage(
    extensionId,
    { action: "status" },
    STATUS_TIMEOUT_MS
  );
  const result = classifyEnvelope(status, "whoop-bridge", readWhoopSession);
  if (!result.sessionActive) return result;
  const reason = reasonOf(status);
  return reason === null ? result : { ...result, reason };
};
