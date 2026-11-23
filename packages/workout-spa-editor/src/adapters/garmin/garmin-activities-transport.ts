/**
 * Bridge transport for the read-only Garmin activities pull (F5).
 *
 * Asks the Garmin Bridge for the activities search through `request`
 * (protocol 2), paced here (createActivitiesPull), or through the legacy
 * `activities` action, which paces inside the extension (protocol 1). The
 * envelope is validated with `safeParse` before it crosses into the
 * application layer (defense-in-depth against a Garmin API shape drift).
 */
import type { GarminActivitiesResponse } from "../../application/import/garmin-activity-schema";
import { garminActivitiesResponseSchema } from "../../application/import/garmin-activity-schema";
import type { FetchActivities } from "../../application/integrations/integration-ports";
import type { RawAnswer } from "../bridge/thin-bridge-request";
import { createActivitiesPull } from "./connector/garmin-activities-pull";
import { callGarmin } from "./connector/garmin-bridge-call";
import { GARMIN_ACTIVITIES_PATH } from "./connector/garmin-paths";
import { readJson } from "./connector/read-garmin-answers";

const ACTIVITIES_TIMEOUT_MS = 15_000;

const readFeed = (answer: RawAnswer) => {
  const data = readJson(answer);
  return {
    activities: Array.isArray(data) ? data : [],
    disabled: false,
    throttled: false,
  };
};

const pulls = new Map<string, ReturnType<typeof createActivitiesPull>>();

const pullFor = (extensionId: string) => {
  let pull = pulls.get(extensionId);
  if (!pull) {
    pull = createActivitiesPull({
      fetchOnce: () =>
        callGarmin(
          extensionId,
          {
            method: "GET",
            path: GARMIN_ACTIVITIES_PATH,
            legacy: { action: "activities" },
            read: readFeed,
          },
          ACTIVITIES_TIMEOUT_MS
        ),
    });
    pulls.set(extensionId, pull);
  }
  return pull;
};

export const readGarminActivities: FetchActivities = async (
  extensionId: string
): Promise<GarminActivitiesResponse> => {
  const res = await pullFor(extensionId)();
  if (!res.ok) {
    throw new Error(res.error ?? "Garmin activities pull failed");
  }
  const parsed = garminActivitiesResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new Error("Malformed Garmin activities response");
  }
  return parsed.data;
};
