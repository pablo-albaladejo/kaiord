/**
 * Train2Go zones-and-weight read: the profile page, read by the Connector
 * (or, from an extension on the previous protocol, its `read-details`).
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
import type { ExtensionResponse } from "../../bridge/bridge-transport";
import { callConnector } from "../../bridge/connector-call";
import type { OperationQueue } from "../../bridge/operation-queue";
import { loadTrain2GoAnswers } from "./load-train2go-answers";
import { DETAILS_PATH } from "./train2go-paths";

const ACTION_T = 35_000;

export const readZones = (
  extensionId: string,
  externalUserId: string,
  queue: OperationQueue,
  signal?: AbortSignal
): Promise<ExtensionResponse> => {
  if (signal?.aborted) {
    return Promise.resolve({ ok: false, error: "Aborted" });
  }
  return queue.enqueue({
    bridgeId: extensionId,
    execute: async () => {
      const { readDetailsAnswer } = await loadTrain2GoAnswers();
      return callConnector(
        extensionId,
        {
          method: "GET",
          path: DETAILS_PATH,
          legacy: { action: "read-details", externalUserId },
          read: readDetailsAnswer,
        },
        ACTION_T
      );
    },
  });
};
