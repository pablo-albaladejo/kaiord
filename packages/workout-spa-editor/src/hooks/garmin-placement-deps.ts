/**
 * The placement pipeline's production wiring: the Dexie ledger, the bridge
 * calendar port, Web Locks, the real clock, and one in-tab join map shared
 * by every entry point (editor, detail, coaching dialog, chat tool), so a
 * second push of a record in the same tab joins the running one.
 */
import type { Analytics } from "@kaiord/core";

import { createWebLocksRecordLock } from "../adapters/locks/web-locks-record-lock";
import type { PlacementJoin } from "../application/garmin-placement/placement-join";
import { SCHEDULE_IDS_IN_FIND } from "../application/garmin-placement/placement-timing";
import type { PlacementPipelineDeps } from "../application/garmin-placement/push-workout-to-garmin-calendar";
import { createGarminCalendarPort } from "./garmin-calendar-operations";
import { ledgerRepo } from "./garmin-push-fn";
import { getGarminExtensionId } from "./use-garmin-bridge-action-helpers";

const joins = new Map<string, PlacementJoin>();
const calendar = createGarminCalendarPort(getGarminExtensionId);

export const buildPlacementDeps = (
  features: readonly string[],
  analytics?: Analytics
): PlacementPipelineDeps => ({
  ledgerRepo,
  calendar,
  scheduleIdsInFind: SCHEDULE_IDS_IN_FIND,
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  features,
  locks: createWebLocksRecordLock(),
  joins,
  analytics,
});
