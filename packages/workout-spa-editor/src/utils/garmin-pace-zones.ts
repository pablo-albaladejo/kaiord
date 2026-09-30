/**
 * The pace zones a Garmin export needs. Stored zones the athlete edited
 * (method "user" or "custom") or a coach sync wrote ("train2go") win when
 * any bound is set; zones of a formula method (e.g. "daniels-5") never do,
 * since a coach threshold sync leaves them computed from an old threshold.
 * Otherwise Z1–Z5 derive from the threshold pace with the Athlete page's
 * zone-map model (`PACE_MODEL`).
 * The distance a pace is per comes from the workout's sport (running: 1 km,
 * swimming: 100 m), never from a zone's stored unit, which the zone editor
 * writes as per-km for every sport. A workout that references a zone the
 * profile cannot resolve is refused with `PaceZonesUnavailableError`,
 * never exported with a guessed range.
 */
import type { PaceZoneTable } from "@kaiord/garmin";

import { isFormulaId } from "../application/coaching/zone-table-classifier-detectors";
import type { KRD } from "../types/krd";
import type { Profile } from "../types/profile";
import type { PaceZone, SportZoneConfig } from "../types/sport-zones";
import { storedZoneTable, thresholdZoneTable } from "./pace-zone-table";
import { PaceZonesUnavailableError } from "./pace-zones-unavailable-error";
import { referencedPaceZones } from "./referenced-pace-zones";
import { getStructuredWorkout } from "./structured-workout";

/** Metres a pace is per, by the workout's sport. */
const METRES_BY_SPORT = { running: 1000, swimming: 100 } as const;

type PaceSport = keyof typeof METRES_BY_SPORT;

const isPaceSport = (sport: string | undefined): sport is PaceSport =>
  sport === "running" || sport === "swimming";

const isSet = (z: PaceZone) => z.minPace > 0 || z.maxPace > 0;

/** A formula method's zones are a function of the threshold, which a coach
    sync can change without recomputing them: derive, never trust them.
    "custom" is listed among the pace methods but holds the athlete's own. */
const isFormulaMethod = (method: string | undefined) =>
  method !== undefined && method !== "custom" && isFormulaId(method);

const zoneTableFor = (
  config: SportZoneConfig | undefined,
  metres: number
): PaceZoneTable => {
  if (!config) return [];
  const stored = config.paceZones?.zones ?? [];
  if (stored.some(isSet) && !isFormulaMethod(config.paceZones?.method))
    return storedZoneTable(stored, metres);
  const pace = config.thresholds.thresholdPace;
  return pace ? thresholdZoneTable(pace, metres) : [];
};

/**
 * The pace zone table the Garmin writer needs for `krd`. `undefined` when
 * the workout references no pace zone; throws `PaceZonesUnavailableError`
 * when it references one the profile cannot resolve for its sport.
 */
export const garminPaceZonesFor = (
  krd: KRD,
  profile: Profile | null | undefined
): PaceZoneTable | undefined => {
  const needed = referencedPaceZones(krd);
  if (needed.size === 0) return undefined;
  const sport = getStructuredWorkout(krd)?.sport;
  if (!isPaceSport(sport))
    throw new PaceZonesUnavailableError("unsupported-pace-zone-sport");
  const config = profile?.sportZones[sport];
  const table = zoneTableFor(config, METRES_BY_SPORT[sport]);
  if (table.length === 0)
    throw new PaceZonesUnavailableError("missing-pace-zones");
  const defined = new Set(table.map((z) => z.zone));
  for (const zone of needed)
    if (!defined.has(zone))
      throw new PaceZonesUnavailableError("incomplete-pace-zones");
  return table;
};
