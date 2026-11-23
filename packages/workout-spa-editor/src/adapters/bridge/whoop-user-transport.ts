/**
 * The WHOOP id every read path is built on, read when the Kaiord App is about
 * to import. The Session check (`status`) answers yes or no and no id.
 *
 * Resolves `null` when the extension holds no captured session (nothing to
 * import with); throws only when the extension did not answer. An extension
 * older than the cheap check refuses the action and is asked through its
 * `status`, which still carries the id.
 */
import { z } from "zod";

import { sendBridgeMessage } from "./bridge-transport";
import { readWhoopStatus, WhoopBridgeError } from "./whoop-transport";

const READ_USER_TIMEOUT_MS = 5_000;
const OLDER_EXTENSION = "Origin or action not permitted";

const userSchema = z.object({ userId: z.number() });

export const readWhoopUserId = async (
  extensionId: string
): Promise<number | null> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "read-user-id" },
    READ_USER_TIMEOUT_MS
  );
  if (!res.ok && res.error === OLDER_EXTENSION) {
    const status = await readWhoopStatus(extensionId);
    return status.connected ? (status.userId ?? null) : null;
  }
  if (!res.ok && res.delivered === false) {
    throw new WhoopBridgeError(res.error ?? "WHOOP read failed", false);
  }
  const parsed = userSchema.safeParse(res.data);
  return res.ok && parsed.success ? parsed.data.userId : null;
};
