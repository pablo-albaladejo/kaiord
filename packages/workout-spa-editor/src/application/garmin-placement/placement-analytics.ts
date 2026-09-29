/**
 * `garmin-calendar-placement` (design §3.8), emitted after the run: enum
 * values and counts only — never an id, a date or a name.
 */
import type { Analytics, AnalyticsEvent } from "@kaiord/core";

import type { ExportLedgerRepository } from "../export/export-ledger-repository.port";
import type { LedgerKey } from "./placement-deps";
import type { PlacementResult } from "./placement-result";
import type { Row } from "./placement-row";

export const PLACEMENT_EVENT = "garmin-calendar-placement";

export const placementEvent = (
  result: PlacementResult,
  durationMs: number,
  row: Row | undefined
): AnalyticsEvent => {
  const abandonedCount = (row?.removalQueue ?? []).filter(
    (e) => e.abandoned && e.state === "retire"
  ).length;
  const event: AnalyticsEvent = {
    result: result.kind,
    durationMs,
    abandonedCount,
  };
  if (result.kind === "failed" || result.kind === "library-only")
    event.reason = result.reason;
  return event;
};

export const measuredPlacement = async (
  deps: {
    ledgerRepo: ExportLedgerRepository;
    now: () => number;
    analytics?: Analytics;
  },
  key: LedgerKey,
  run: () => Promise<PlacementResult>
): Promise<PlacementResult> => {
  const startedAt = deps.now();
  const result = await run();
  const row = await deps.ledgerRepo.findByNaturalKey(key);
  deps.analytics?.event(
    PLACEMENT_EVENT,
    placementEvent(result, deps.now() - startedAt, row)
  );
  return result;
};
