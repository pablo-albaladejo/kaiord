/**
 * GarminLibraryPort over the Garmin Bridge: the delete of one library
 * workout through `request` (protocol 2). The previous protocol has no
 * such action, so an extension one version behind deletes nothing. Waits
 * `SPA_ACTION_TIMEOUT_MS`, longer than the bridge's own deadline. Never
 * throws: an invalid id is refused before anything is sent, a failure is
 * the envelope's fields.
 */
import type { GarminLibraryPort } from "../../../application/garmin-placement/garmin-library-port";
import { SPA_ACTION_TIMEOUT_MS } from "../../../application/garmin-placement/placement-timing";
import { sendBridgeMessage } from "../../bridge/bridge-transport";
import { callConnector, type ConnectorSend } from "../../bridge/connector-call";
import { failureOf, refused } from "./garmin-calendar-answers";
import { isGarminId } from "./garmin-ids";
import { garminLibraryWorkoutPath } from "./garmin-paths";
import { readNothing } from "./read-garmin-answers";

export const createGarminLibraryPort = (
  extensionId: () => string,
  send: ConnectorSend = sendBridgeMessage
): GarminLibraryPort => ({
  remove: async (workoutId) => {
    if (!isGarminId(workoutId)) return refused("Invalid workoutId");
    const res = await callConnector(
      extensionId(),
      {
        method: "DELETE",
        path: garminLibraryWorkoutPath(workoutId),
        read: readNothing,
      },
      SPA_ACTION_TIMEOUT_MS,
      send
    );
    return res.ok ? { ok: true } : failureOf(res);
  },
});
