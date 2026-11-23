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
  type ExtensionResponse,
  sendBridgeMessage,
} from "../../bridge/bridge-transport";
import { callConnector } from "../../bridge/connector-call";
import type { BridgeCall } from "../../bridge/thin-bridge-request";
import { loadTrain2GoAnswers } from "./load-train2go-answers";
import { dailyPath, weeklyPath } from "./train2go-paths";
import { toPingResult, type Train2GoPingResult } from "./train2go-ping-result";
import type { Train2GoActivity, Train2GoComment } from "./train2go-wire-types";

export type { Train2GoPingResult } from "./train2go-ping-result";
export type { Train2GoActivity, Train2GoComment } from "./train2go-wire-types";

type ReadData = {
  activities: Train2GoActivity[];
  // Present only on `read-day` responses from a comments-capable bridge.
  comments?: Train2GoComment[];
};
type ReadResponse = ExtensionResponse & { data?: ReadData };

const PING_T1 = 2_000;
const PING_T2 = 4_000;
const ACTION_T = 35_000;

export const ping = async (
  extensionId: string
): Promise<Train2GoPingResult> => {
  const first = await sendBridgeMessage(
    extensionId,
    { action: "ping" },
    PING_T1
  );
  if (first.ok) return toPingResult(first);
  if (first.error === "Extension did not respond") {
    return toPingResult(
      await sendBridgeMessage(extensionId, { action: "ping" }, PING_T2)
    );
  }
  return toPingResult(first);
};

const readGet = (
  extensionId: string,
  call: Omit<BridgeCall<ReadData>, "method">
): Promise<ReadResponse> =>
  callConnector(
    extensionId,
    { method: "GET", ...call },
    ACTION_T
  ) as Promise<ReadResponse>;

export const readWeek = async (
  extensionId: string,
  date: string,
  externalUserId: string
): Promise<ReadResponse> => {
  const { readWeekAnswer } = await loadTrain2GoAnswers();
  return readGet(extensionId, {
    path: weeklyPath(date, externalUserId),
    legacy: { action: "read-week", date, userId: externalUserId },
    read: readWeekAnswer,
  });
};

export const readDay = async (
  extensionId: string,
  date: string,
  externalUserId: string
): Promise<ReadResponse> => {
  const { readDayAnswer } = await loadTrain2GoAnswers();
  return readGet(extensionId, {
    path: dailyPath(date, externalUserId),
    legacy: { action: "read-day", date, userId: externalUserId },
    read: readDayAnswer(date),
  });
};

export const openTrain2Go = (extensionId: string): Promise<ExtensionResponse> =>
  sendBridgeMessage(extensionId, { action: "open-train2go" }, PING_T1);

export { readZones } from "./train2go-read-zones";
