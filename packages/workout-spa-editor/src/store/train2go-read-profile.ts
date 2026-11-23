/**
 * The profile read the connect flow links with: the athlete id and name. The
 * connection check (`ping`) answers yes or no and nothing else, so it cannot
 * link. The Connector reads Train2Go's profile ping raw through the thin
 * Bridge; an extension on the previous protocol is asked through its `ping`,
 * which still carries the profile.
 */
import { readProfileAnswer } from "../adapters/train2go/connector/read-profile-answer";
import { readThroughBridge } from "../adapters/train2go/connector/train2go-bridge-request";
import { PROFILE_PING_PATH } from "../adapters/train2go/connector/train2go-paths";
import { toPingResult, type Train2GoPingResult } from "./train2go-ping-result";
import { train2goSendMessage } from "./train2go-send-message";

const READ_PROFILE_TIMEOUT_MS = 4_000;

export const readProfile = async (
  extensionId: string
): Promise<Train2GoPingResult> =>
  toPingResult(
    await readThroughBridge(
      (message) =>
        train2goSendMessage(extensionId, message, READ_PROFILE_TIMEOUT_MS),
      {
        path: PROFILE_PING_PATH,
        legacy: { action: "ping" },
        read: readProfileAnswer,
      }
    )
  );
