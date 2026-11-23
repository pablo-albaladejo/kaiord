/**
 * One call through the Garmin Bridge to the extension with `extensionId`,
 * each leg (the request, and the legacy action for an extension one protocol
 * behind) waiting `timeoutMs`.
 */
import type { ExtensionResponse } from "../../bridge/bridge-transport";
import { sendBridgeMessage } from "../../bridge/bridge-transport";
import type { BridgeCall } from "../../bridge/thin-bridge-request";
import { callThroughBridge } from "../../bridge/thin-bridge-request";

export type GarminSend = (
  extensionId: string,
  message: unknown,
  timeoutMs: number
) => Promise<ExtensionResponse>;

export const callGarmin = <T>(
  extensionId: string,
  call: BridgeCall<T>,
  timeoutMs: number,
  send: GarminSend = sendBridgeMessage
): Promise<ExtensionResponse> =>
  callThroughBridge((message) => send(extensionId, message, timeoutMs), call);
