/**
 * One read through the Train2Go Bridge, in whichever protocol it speaks:
 * a `GET` of a listed path, answered raw (protocol 2) or by the legacy
 * action the extension reads itself (protocol 1). The protocol handling is
 * the shared `callThroughBridge`; Train2Go's Bridge lists reads only.
 */
import type { BridgeSend, RawAnswer } from "../../bridge/thin-bridge-request";
import { callThroughBridge } from "../../bridge/thin-bridge-request";

export type { BridgeSend, RawAnswer };

export type BridgeRead<T> = {
  path: string;
  legacy: Record<string, unknown>;
  read: (answer: RawAnswer) => T;
};

export const readThroughBridge = <T>(send: BridgeSend, read: BridgeRead<T>) =>
  callThroughBridge(send, { method: "GET", ...read });
