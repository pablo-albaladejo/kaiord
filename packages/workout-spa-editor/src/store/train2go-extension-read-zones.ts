/**
 * Train2Go `read-details` wire fetch.
 *
 * Routes the action through the shared `OperationQueue` so the per-bridge
 * 60/h cap covers zones-sync alongside any other queue consumer (today:
 * profile-snapshot push). The action payload uses `externalUserId` (not
 * `userId`) to mirror the bridge spec.
 *
 * `signal?.aborted` is checked at the call site to short-circuit BEFORE
 * the queue accepts the op — once enqueued, the call must run to
 * completion to avoid leaving the rolling-window counter inconsistent.
 */
import type { OperationQueue } from "../adapters/bridge/operation-queue";
import {
  type Train2GoExtensionResponse,
  train2goSendMessage,
} from "./train2go-send-message";

const ACTION_T = 35_000;

export const readZones = (
  extensionId: string,
  externalUserId: string,
  queue: OperationQueue,
  signal?: AbortSignal
): Promise<Train2GoExtensionResponse> => {
  if (signal?.aborted) {
    return Promise.resolve({ ok: false, error: "Aborted" });
  }
  return queue.enqueue({
    bridgeId: extensionId,
    execute: () =>
      train2goSendMessage(
        extensionId,
        { action: "read-details", externalUserId },
        ACTION_T
      ),
  });
};
