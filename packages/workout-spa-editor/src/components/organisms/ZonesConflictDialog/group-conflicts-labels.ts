/**
 * Static label tables + group factory for `group-conflicts.ts`.
 * Co-located so the parent stays under the 80-line cap.
 */
import type { BandGroup } from "./group-conflicts";

const SPORT_LABELS = {
  cycling: "Cycling",
  running: "Running",
  swimming: "Swimming",
} as const;

const KIND_LABELS = {
  heartRateZones: "HR Zones",
  powerZones: "Power Zones",
  paceZones: "Pace Zones",
} as const;

export const buildGroup = (
  sport: BandGroup["sport"],
  kind: BandGroup["kind"]
): BandGroup => ({
  groupKey: `${sport}.${kind}`,
  sport,
  kind,
  label: `${SPORT_LABELS[sport]} ${KIND_LABELS[kind]}`,
  conflicts: [],
});
