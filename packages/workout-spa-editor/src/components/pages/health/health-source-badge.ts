/**
 * Health record source badge — same small-lookup-with-fallback pattern
 * as the coaching record's sourceBadge
 * (adapters/train2go/coaching-record-to-activity.converter.ts): no new
 * badge system, just this metric's flavor of it.
 *
 * Derives a short display label from a health record's `sourceBridgeId`
 * (F1.1 provenance stamp; "unknown" for pre-v17 backfilled rows).
 */
const HEALTH_SOURCE_BADGE_BY_ID: Record<string, string> = {
  manual: "Manual",
  "fit-import": "FIT",
  "garmin-bridge": "Garmin",
  "whoop-bridge": "WHOOP",
  unknown: "Unknown",
};

export const healthSourceBadge = (
  sourceBridgeId: string | undefined
): string => {
  const id = sourceBridgeId ?? "unknown";
  return HEALTH_SOURCE_BADGE_BY_ID[id] ?? id.toUpperCase();
};
