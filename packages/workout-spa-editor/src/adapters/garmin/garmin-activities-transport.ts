/**
 * Bridge transport for the read-only Garmin activities pull (F5).
 *
 * Sends the `activities` action to the garmin-bridge extension and validates
 * the envelope with `safeParse` before it crosses into the application layer
 * (defense-in-depth against a Garmin API shape drift). The bridge already
 * enforces throttle/backoff/kill-switch; this layer only transports + parses.
 */
import type { GarminActivitiesResponse } from "../../application/import/garmin-activity-schema";
import { garminActivitiesResponseSchema } from "../../application/import/garmin-activity-schema";
import type { FetchActivities } from "../../application/integrations/integration-ports";
import { sendBridgeMessage } from "../bridge/bridge-transport";

const ACTIVITIES_TIMEOUT_MS = 15_000;

export const readGarminActivities: FetchActivities = async (
  extensionId: string
): Promise<GarminActivitiesResponse> => {
  const res = await sendBridgeMessage(
    extensionId,
    { action: "activities" },
    ACTIVITIES_TIMEOUT_MS
  );
  if (!res.ok) {
    throw new Error(res.error ?? "Garmin activities pull failed");
  }
  const parsed = garminActivitiesResponseSchema.safeParse(res.data);
  if (!parsed.success) {
    throw new Error("Malformed Garmin activities response");
  }
  return parsed.data;
};
