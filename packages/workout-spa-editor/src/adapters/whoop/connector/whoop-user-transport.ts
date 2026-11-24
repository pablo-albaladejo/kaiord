/**
 * The WHOOP id every read path is built on, read when the Kaiord App is about
 * to import. The Session check (`status`) answers yes or no and no id.
 *
 * Resolves `null` when the extension holds no sign-in (nothing to import
 * with). A held sign-in whose token names no account id cannot import
 * either, and says so: it throws `whoopAccountMissing`, whose reason is the
 * shared `no-account-id` notice (#1091). Throws too when the extension did
 * not answer. An extension one protocol behind does not know the action and
 * is asked through its `status`, which still carries the id; the current one
 * refuses `read-user-id` when it holds no id, and its `status` tells whether
 * a sign-in is held.
 */
import type { ConnectionReason } from "@kaiord/i18n/connection-notices";
import { z } from "zod";

import { sendBridgeMessage } from "../../bridge/bridge-transport";
import { speaksPreviousProtocol } from "../../bridge/thin-bridge-request";
import { readWhoopStatus, WhoopBridgeError } from "./whoop-transport";

const READ_USER_TIMEOUT_MS = 5_000;
const NO_ACCOUNT = "WHOOP holds a sign-in that names no account";

const userSchema = z.object({ userId: z.number() });

export type WhoopAccountMissing = Error & { readonly reason: ConnectionReason };

export const whoopAccountMissing = (): WhoopAccountMissing =>
  Object.assign(new Error(NO_ACCOUNT), { reason: "no-account-id" } as const);

/** The id of a held sign-in, `null` with none held; throws when held without one. */
const idOfHeldSignIn = async (extensionId: string): Promise<number | null> => {
  const status = await readWhoopStatus(extensionId);
  if (!status.connected) return null;
  if (typeof status.userId === "number") return status.userId;
  throw whoopAccountMissing();
};

export const readWhoopUserId = async (
  extensionId: string
): Promise<number | null> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "read-user-id" },
    READ_USER_TIMEOUT_MS
  );
  if (!res.ok && res.delivered === false) {
    throw new WhoopBridgeError(res.error ?? "WHOOP read failed", false);
  }
  const parsed = userSchema.safeParse(res.data);
  if (res.ok && parsed.success) return parsed.data.userId;
  if (!res.ok && !speaksPreviousProtocol(res)) {
    // The current extension refuses when it holds no id: held or not?
    const status = await readWhoopStatus(extensionId);
    if (status.connected) throw whoopAccountMissing();
    return null;
  }
  return idOfHeldSignIn(extensionId);
};
