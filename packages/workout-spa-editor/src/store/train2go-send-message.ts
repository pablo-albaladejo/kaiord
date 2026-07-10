/**
 * Train2Go extension messaging for the store layer, delegating to the
 * shared `sendBridgeMessage` (adapters/bridge — the only module allowed
 * to touch chrome.runtime, per spa-integration-adapters).
 */
import type { ExtensionResponse } from "../adapters/bridge/bridge-transport";
import { sendBridgeMessage } from "../adapters/bridge/bridge-transport";

export type Train2GoExtensionResponse = ExtensionResponse;

export const train2goSendMessage = (
  extensionId: string,
  message: unknown,
  timeoutMs: number
): Promise<Train2GoExtensionResponse> =>
  sendBridgeMessage(extensionId, message, timeoutMs);
