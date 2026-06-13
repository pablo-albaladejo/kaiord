/**
 * Train2Go Extension Transport — JSON parse boundary for the SPA.
 *
 * Stringifies platform ids (userId, sourceId) HERE, never via
 * String(parsedNumber) downstream (lossy above MAX_SAFE_INTEGER).
 * Full wire-side losslessness needs a bridge-extension reviver — out
 * of scope for this SPA work.
 */

import { toPingResult, type Train2GoPingResult } from "./train2go-ping-result";
import {
  type Train2GoExtensionResponse,
  train2goSendMessage,
} from "./train2go-send-message";

export type { Train2GoPingResult } from "./train2go-ping-result";

export type Train2GoActivity = {
  id: number;
  date: string;
  sport: string;
  title: string;
  duration: string;
  workload: number;
  status: number;
  description?: string;
  completion?: number;
};

export type Train2GoComment = {
  author: string;
  isOwn: boolean;
  timestamp: string;
  text: string;
};

type ReadData = {
  activities: Train2GoActivity[];
  // Present only on `read-day` responses from a comments-capable bridge.
  comments?: Train2GoComment[];
};
type ReadResponse = Train2GoExtensionResponse & { data?: ReadData };

const PING_T1 = 2_000;
const PING_T2 = 4_000;
const ACTION_T = 35_000;

export const ping = async (
  extensionId: string
): Promise<Train2GoPingResult> => {
  const first = await train2goSendMessage(
    extensionId,
    { action: "ping" },
    PING_T1
  );
  if (first.ok) return toPingResult(first);
  if (first.error === "Extension did not respond") {
    return toPingResult(
      await train2goSendMessage(extensionId, { action: "ping" }, PING_T2)
    );
  }
  return toPingResult(first);
};

const readAction = (
  extensionId: string,
  action: "read-week" | "read-day",
  date: string,
  externalUserId: string
): Promise<ReadResponse> =>
  train2goSendMessage(
    extensionId,
    { action, date, userId: externalUserId },
    ACTION_T
  ) as Promise<ReadResponse>;

export const readWeek = (
  extensionId: string,
  date: string,
  externalUserId: string
): Promise<ReadResponse> =>
  readAction(extensionId, "read-week", date, externalUserId);

export const readDay = (
  extensionId: string,
  date: string,
  externalUserId: string
): Promise<ReadResponse> =>
  readAction(extensionId, "read-day", date, externalUserId);

export const openTrain2Go = (
  extensionId: string
): Promise<Train2GoExtensionResponse> =>
  train2goSendMessage(extensionId, { action: "open-train2go" }, PING_T1);

export { readZones } from "./train2go-extension-read-zones";
