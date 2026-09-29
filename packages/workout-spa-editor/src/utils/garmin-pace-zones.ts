/**
 * The pace zones a Garmin export needs. Garmin Connect has no pace zone
 * numbers: a `pace` target in zone units must be written as its m/s range,
 * resolved from the profile's pace zones for the workout's sport. A workout
 * that references a pace zone the profile cannot resolve is refused with
 * `MissingPaceZonesError`, never exported with a guessed range.
 */
import type { PaceZoneTable } from "@kaiord/garmin";

import type { KRD } from "../types/krd";
import type { Profile } from "../types/profile";
import type { PaceZone } from "../types/sport-zones";
import { getStructuredWorkout } from "./structured-workout";

export class MissingPaceZonesError extends Error {
  constructor() {
    super("This workout uses pace zones the profile does not define.");
    this.name = "MissingPaceZonesError";
  }
}

/** Metres per pace unit: `minPace`/`maxPace` are seconds per this distance. */
const METRES: Record<PaceZone["unit"], number> = {
  min_per_km: 1000,
  min_per_100m: 100,
};

const paceSport = (sport: string | undefined) =>
  sport === "running" || sport === "swimming" ? sport : undefined;

type Node = { target?: unknown; steps?: unknown };

const paceZoneOf = (target: unknown): number | undefined => {
  if (!target || typeof target !== "object") return undefined;
  const { type, value } = target as { type?: unknown; value?: unknown };
  if (type !== "pace" || !value || typeof value !== "object") return undefined;
  const v = value as { unit?: unknown; value?: unknown };
  if (v.unit !== "zone") return undefined;
  // A zone target without a number resolves to no zone: never defined.
  return typeof v.value === "number" ? v.value : 0;
};

const collectZones = (steps: unknown, out: Set<number>): Set<number> => {
  if (!Array.isArray(steps)) return out;
  for (const step of steps as Node[]) {
    if (!step || typeof step !== "object") continue;
    const zone = paceZoneOf(step.target);
    if (zone !== undefined) out.add(zone);
    collectZones(step.steps, out);
  }
  return out;
};

/** The pace zone numbers the workout's targets reference (blocks too). */
export const referencedPaceZones = (krd: KRD): Set<number> =>
  collectZones(getStructuredWorkout(krd)?.steps, new Set());

/** Seconds-per-distance zones → m/s; a zone with an unset bound is skipped. */
export const toPaceZoneTable = (zones: readonly PaceZone[]): PaceZoneTable =>
  zones
    .filter((z) => z.minPace > 0 && z.maxPace > 0)
    .map((z) => {
      const metres = METRES[z.unit];
      // Fewer seconds per distance is faster: the lower pace bound is maxMps.
      return {
        zone: z.zone,
        minMps: metres / Math.max(z.minPace, z.maxPace),
        maxMps: metres / Math.min(z.minPace, z.maxPace),
      };
    });

/**
 * The pace zone table the Garmin writer needs for `krd`, from `profile`'s
 * zones for the workout's sport. `undefined` when the workout references
 * no pace zone; throws `MissingPaceZonesError` when it references one the
 * profile does not define.
 */
export const garminPaceZonesFor = (
  krd: KRD,
  profile: Profile | null | undefined
): PaceZoneTable | undefined => {
  const needed = referencedPaceZones(krd);
  if (needed.size === 0) return undefined;
  const sport = paceSport(getStructuredWorkout(krd)?.sport);
  const zones = sport && profile?.sportZones[sport]?.paceZones?.zones;
  const table = toPaceZoneTable(zones || []);
  const defined = new Set(table.map((z) => z.zone));
  for (const zone of needed)
    if (!defined.has(zone)) throw new MissingPaceZonesError();
  return table;
};
