/**
 * Train2Go CoachingTransport — implements the application-layer port.
 *
 * Wraps the low-level chrome.runtime.sendMessage transport with
 * platform-specific message shapes and maps wire activities to
 * CoachingActivityRecord at the boundary. Use cases never see
 * Train2GoActivity.
 */

import type {
  CoachingPingResult,
  CoachingTransport,
} from "../../application/coaching/coaching-transport-port";
import type { Train2GoActivity } from "../../store/train2go-extension-transport";
import {
  openTrain2Go,
  ping,
  readDay,
  readWeek,
} from "../../store/train2go-extension-transport";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import { toCoachingActivityRecord } from "./train2go-record.mapper";

const TRAIN2GO = "train2go";

const buildErr = (action: string, error: string | undefined): Error => {
  if (error === "Session expired") return new Error("Session expired");
  return new Error(error ?? `${action} failed`);
};

const fetchActivities = async (
  action: string,
  res: {
    ok: boolean;
    data?: { activities: Train2GoActivity[] };
    error?: string;
  },
  profileId: string,
  fetchedAt: string
): Promise<CoachingActivityRecord[]> => {
  if (!res.ok) throw buildErr(action, res.error);
  const activities = res.data?.activities ?? [];
  return activities.map((a) =>
    toCoachingActivityRecord(profileId, a, fetchedAt)
  );
};

export const createTrain2GoCoachingTransport = (
  getExtensionId: () => string,
  now: () => string = () => new Date().toISOString()
): CoachingTransport => ({
  source: TRAIN2GO,

  ping: async (): Promise<CoachingPingResult> => {
    const res = await ping(getExtensionId());
    return {
      sessionActive: res.sessionActive,
      externalUserId: res.externalUserId,
      externalUserName: res.externalUserName,
    };
  },

  openExternal: async () => {
    await openTrain2Go(getExtensionId());
  },

  readWeek: async (profileId, weekStart, externalUserId) => {
    const res = await readWeek(getExtensionId(), weekStart, externalUserId);
    return fetchActivities("Read week", res, profileId, now());
  },

  readDay: async (profileId, date, externalUserId) => {
    const res = await readDay(getExtensionId(), date, externalUserId);
    return fetchActivities("Read day", res, profileId, now());
  },
});
