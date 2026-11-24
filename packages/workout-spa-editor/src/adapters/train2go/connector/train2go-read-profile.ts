/**
 * The profile read the connect flow links with: the athlete id and name. The
 * connection check (`ping`) answers yes or no and nothing else, so it cannot
 * link. The Connector reads Train2Go's profile ping raw through the thin
 * Bridge; an extension on the previous protocol is asked through its `ping`,
 * which still carries the profile.
 */
import { callConnector } from "../../bridge/connector-call";
import { readProfileAnswer } from "./read-profile-answer";
import { PROFILE_PING_PATH } from "./train2go-paths";
import { toPingResult, type Train2GoPingResult } from "./train2go-ping-result";

const READ_PROFILE_TIMEOUT_MS = 4_000;

export const readProfile = async (
  extensionId: string
): Promise<Train2GoPingResult> =>
  toPingResult(
    await callConnector(
      extensionId,
      {
        method: "GET",
        path: PROFILE_PING_PATH,
        legacy: { action: "ping" },
        read: readProfileAnswer,
      },
      READ_PROFILE_TIMEOUT_MS
    )
  );
