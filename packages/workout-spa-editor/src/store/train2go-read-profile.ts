/**
 * The explicit profile read the connect flow links with: the athlete id and
 * name. The connection check (`ping`) answers yes or no and nothing else, so
 * it cannot link. An extension older than the cheap check refuses the action
 * and is asked through its `ping`, which still carries the profile.
 */
import { ping } from "./train2go-extension-transport";
import { toPingResult, type Train2GoPingResult } from "./train2go-ping-result";
import { train2goSendMessage } from "./train2go-send-message";

const READ_PROFILE_TIMEOUT_MS = 4_000;
const OLDER_EXTENSION = "Origin or action not permitted";

export const readProfile = async (
  extensionId: string
): Promise<Train2GoPingResult> => {
  const res = await train2goSendMessage(
    extensionId,
    { action: "read-profile" },
    READ_PROFILE_TIMEOUT_MS
  );
  if (!res.ok && res.error === OLDER_EXTENSION) return ping(extensionId);
  return toPingResult(res);
};
