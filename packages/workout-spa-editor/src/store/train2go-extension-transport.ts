/**
 * Train2Go Extension Transport — JSON parse boundary for the SPA.
 *
 * Reads go through the Train2Go Connector (adapters/train2go/connector):
 * the extension is asked for Train2Go's raw answer and the Connector reads
 * it; an extension on the previous protocol is asked the legacy way.
 *
 * Stringifies platform ids (userId, sourceId) HERE, never via
 * String(parsedNumber) downstream (lossy above MAX_SAFE_INTEGER).
 * Full wire-side losslessness needs a bridge-extension reviver — out
 * of scope for this SPA work.
 */

import {
  readDayAnswer,
  readWeekAnswer,
} from "../adapters/train2go/connector/read-train2go-answers";
import { readThroughBridge } from "../adapters/train2go/connector/train2go-bridge-request";
import {
  dailyPath,
  weeklyPath,
} from "../adapters/train2go/connector/train2go-paths";
import type {
  Train2GoActivity,
  Train2GoComment,
} from "../adapters/train2go/connector/train2go-wire-types";
import { toPingResult, type Train2GoPingResult } from "./train2go-ping-result";
import {
  type Train2GoExtensionResponse,
  train2goSendMessage,
} from "./train2go-send-message";

export type {
  Train2GoActivity,
  Train2GoComment,
} from "../adapters/train2go/connector/train2go-wire-types";
export type { Train2GoPingResult } from "./train2go-ping-result";

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

const sendFor =
  (extensionId: string) =>
  (message: unknown): Promise<Train2GoExtensionResponse> =>
    train2goSendMessage(extensionId, message, ACTION_T);

export const readWeek = (
  extensionId: string,
  date: string,
  externalUserId: string
): Promise<ReadResponse> =>
  readThroughBridge(sendFor(extensionId), {
    path: weeklyPath(date, externalUserId),
    legacy: { action: "read-week", date, userId: externalUserId },
    read: readWeekAnswer,
  }) as Promise<ReadResponse>;

export const readDay = (
  extensionId: string,
  date: string,
  externalUserId: string
): Promise<ReadResponse> =>
  readThroughBridge(sendFor(extensionId), {
    path: dailyPath(date, externalUserId),
    legacy: { action: "read-day", date, userId: externalUserId },
    read: readDayAnswer(date),
  }) as Promise<ReadResponse>;

export const openTrain2Go = (
  extensionId: string
): Promise<Train2GoExtensionResponse> =>
  train2goSendMessage(extensionId, { action: "open-train2go" }, PING_T1);

export { readZones } from "./train2go-extension-read-zones";
