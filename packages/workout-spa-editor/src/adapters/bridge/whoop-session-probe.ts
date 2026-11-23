/**
 * WHOOP's Session check: its `status` reads the extension's own storage and
 * asks WHOOP nothing. A held sign-in whose token names no account id
 * (`custom:user_id`) cannot serve an import, so the check also learns that,
 * still without a request to WHOOP: the extension one protocol behind says
 * it in `status` (`userId: null`); the current one answers no id there, and
 * its `read-user-id` refuses when it holds none.
 */
import { classifyEnvelope } from "./bridge-envelope-classify";
import { readWhoopSession } from "./bridge-legacy-session-readers";
import type { SessionProber } from "./bridge-session-probe-types";
import { type ExtensionResponse, sendBridgeMessage } from "./bridge-transport";
import { speaksPreviousProtocol } from "./thin-bridge-request";

const STATUS_TIMEOUT_MS = 5_000;

const namesNoAccount = async (
  extensionId: string,
  status: ExtensionResponse
): Promise<boolean> => {
  if (speaksPreviousProtocol(status)) {
    return (status.data as { userId?: unknown } | undefined)?.userId == null;
  }
  const user = await sendBridgeMessage(
    extensionId,
    { action: "read-user-id" },
    STATUS_TIMEOUT_MS
  );
  return !user.ok && user.delivered !== false;
};

export const probeWhoopSession: SessionProber = async (extensionId) => {
  const status = await sendBridgeMessage(
    extensionId,
    { action: "status" },
    STATUS_TIMEOUT_MS
  );
  const result = classifyEnvelope(status, "whoop-bridge", readWhoopSession);
  if (!result.sessionActive) return result;
  return (await namesNoAccount(extensionId, status))
    ? { ...result, reason: "no-account-id" }
    : result;
};
