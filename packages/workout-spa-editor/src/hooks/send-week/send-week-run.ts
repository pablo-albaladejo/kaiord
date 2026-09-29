/**
 * Wires one bulk run (a first send or a retry) to production: the quiet
 * bridge push (never the global push state), the shared placement deps,
 * `placeRecord` per item, and `garmin-calendar-bulk` with this run's counts.
 */
import type { Analytics } from "@kaiord/core";

import { bulkEvent } from "../../application/garmin-bulk/bulk-analytics";
import {
  bulkPreflight,
  type BulkPreflightFailure,
} from "../../application/garmin-bulk/bulk-preflight";
import type { WeekPushCandidate } from "../../application/garmin-bulk/select-week-push-candidates";
import {
  type BulkOutcome,
  type BulkRun,
  sendWeekToGarmin,
} from "../../application/garmin-bulk/send-week-to-garmin";
import type { PersistencePort } from "../../ports/persistence-port";
import { placeRecordResult } from "../garmin-place-record";
import { buildPlacementDeps } from "../garmin-placement-deps";
import { pushQuiet } from "../garmin-push-fn";

export type SendWeekContext = {
  persistence: PersistencePort;
  analytics: Analytics;
  features: readonly string[];
  routeActive: boolean;
  bridgeInstalled: boolean;
  sessionActive: boolean;
};

export type SendWeekHandlers = {
  isCancelled: () => boolean;
  onOutcome: (outcome: BulkOutcome) => void;
};

export const runSendWeek = async (
  ctx: SendWeekContext,
  candidates: readonly WeekPushCandidate[],
  handlers: SendWeekHandlers
): Promise<BulkRun | BulkPreflightFailure> => {
  const deps = buildPlacementDeps(ctx.features, ctx.analytics);
  const failure = bulkPreflight({ ...ctx, ...deps });
  if (failure) return failure;
  const run = await sendWeekToGarmin(
    {
      pushOne: (id) => placeRecordResult(ctx.persistence, pushQuiet, id, deps),
      sleep: deps.sleep,
      ...handlers,
    },
    candidates
  );
  ctx.analytics.event("garmin-calendar-bulk", bulkEvent(run.outcomes));
  return run;
};
