/**
 * Garmin extension messaging for the store layer. The wire transport is
 * the shared `sendBridgeMessage` (adapters/bridge — the only module
 * allowed to touch chrome.runtime, per spa-integration-adapters); this
 * file adds garmin's ping retry policy on top.
 */
import type { ExtensionResponse } from "../adapters/bridge/bridge-transport";
import { sendBridgeMessage } from "../adapters/bridge/bridge-transport";

export const sendMessage = (
  extensionId: string,
  message: unknown,
  timeoutMs: number
): Promise<ExtensionResponse> =>
  sendBridgeMessage(extensionId, message, timeoutMs);

type PingData = { gcApi?: { ok: boolean } };

const PING_TIMEOUT_1 = 2_000;
const PING_TIMEOUT_2 = 4_000;

export const ping = async (
  extensionId: string
): Promise<ExtensionResponse & { data?: PingData }> => {
  const res = await sendMessage(
    extensionId,
    { action: "ping" },
    PING_TIMEOUT_1
  );
  if (res.ok) return res as ExtensionResponse & { data?: PingData };
  if (res.error === "Extension did not respond") {
    return (await sendMessage(
      extensionId,
      { action: "ping" },
      PING_TIMEOUT_2
    )) as ExtensionResponse & { data?: PingData };
  }
  return res as ExtensionResponse & { data?: PingData };
};
