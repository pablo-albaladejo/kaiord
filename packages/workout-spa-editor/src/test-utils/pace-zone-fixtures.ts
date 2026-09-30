/**
 * Pace-zone fixtures (test-only), every profile built by the app's own
 * producers — the profile factory, the threshold and zone use cases, the
 * zone editor's `buildDefaultZone`, the Train2Go band writer — never typed
 * by hand, so a fixture cannot hold a shape production never writes.
 *
 * The workout's targets are pace ZONES, the shape AI-converted running
 * sessions produce ("Zone 1 · pace").
 */
import type { KRD } from "@kaiord/core";

import { writePaceBand } from "../application/coaching/sync-zones-band-writes";
import { createNewProfile } from "../application/profile/helpers/profile-factory";
import { setZoneMethod } from "../application/profile/zones/set-zone-method";
import { updateSportThresholds } from "../application/profile/zones/update-sport-thresholds";
import { updateSportZones } from "../application/profile/zones/update-sport-zones";
import { buildDefaultZone } from "../components/organisms/ZoneEditor/utils/default-zone";
import type { Profile } from "../types/profile";
import type { PaceZone } from "../types/sport-zones";
import { calculatePaceZones } from "../utils/calculate-pace-zones";
import { createInMemoryPersistence } from "./in-memory-persistence";

type PaceSport = "running" | "swimming";

/** Threshold paces: 5:00/km running, 1:40/100m swimming. */
export const RUN_THRESHOLD = 300;
export const SWIM_THRESHOLD = 100;
export const ALL_ZONES = [1, 2, 3, 4, 5];
/** `toBeCloseTo` digits for m/s values written to the GCN payload. */
export const MPS_DIGITS = 6;

const paceZoneStep = (stepIndex: number, zone: number) => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 600 },
  targetType: "pace",
  target: { type: "pace", value: { unit: "zone", value: zone } },
  intensity: "active",
});

/** A step at the first zone, then 3 × the rest in a repetition block. */
export const paceZoneKrd = (sport = "running", zones = [1, 2]): KRD => {
  const [first, ...rest] = zones.map((z, i) => paceZoneStep(i, z));
  const steps = rest.length
    ? [first, { repeatCount: 3, steps: rest }]
    : [first];
  return {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-09-30T08:00:00Z", sport },
    extensions: { structured_workout: { name: "Zones", sport, steps } },
  } as unknown as KRD;
};

/** A new profile, as the profile factory creates it. */
export const freshProfile = (): Profile => createNewProfile("Runner");

const persisted = async (profile: Profile) => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.put(profile);
  return persistence;
};

/** Threshold pace set as the Athlete page does: `SportZoneThresholds`
    writes `paceUnit ?? "min_per_km"`, for swimming too. */
export const withThreshold = async (
  profile: Profile,
  sport: PaceSport,
  thresholdPace: number
): Promise<Profile> =>
  updateSportThresholds(await persisted(profile), profile.id, sport, {
    thresholdPace,
    paceUnit: "min_per_km",
  });

/** The Daniels method chosen in the zone editor (before any threshold). */
export const withDaniels = async (
  profile: Profile,
  sport: PaceSport
): Promise<Profile> =>
  setZoneMethod(
    await persisted(profile),
    profile.id,
    sport,
    "paceZones",
    "daniels-5",
    []
  );

/** Zones edited in the zone editor (`updateSportZones` → method "user"). */
export const withEditedZones = async (
  profile: Profile,
  sport: PaceSport,
  zones: PaceZone[]
): Promise<Profile> =>
  updateSportZones(
    await persisted(profile),
    profile.id,
    sport,
    "paceZones",
    zones
  );

/** A zone added in the zone editor, then given bounds: `buildDefaultZone`
    stamps "min_per_km" whatever the sport. */
export const editorZone = (zone: number, minPace: number, maxPace: number) => ({
  ...(buildDefaultZone("paceZones", zone) as PaceZone),
  minPace,
  maxPace,
});

/** Daniels zones as `calculatePaceZones` stores them (Z5 fast end = 0). */
export const danielsZones = (thresholdPace: number) =>
  calculatePaceZones(thresholdPace, "min_per_km");

/** Train2Go running bands z1–z4 (seconds/km, faster → minPace) and z5
    with only its slow end, as a coach sync writes into a fresh profile. */
export const T2G_RUN_BANDS = [
  [330, 390],
  [300, 330],
  [285, 300],
  [270, 285],
  [0, 270],
] as const;

export const coachSyncedProfile = (): Profile =>
  T2G_RUN_BANDS.reduce((profile, [fast, slow], i) => {
    const band = `z${i + 1}` as "z1";
    const withSlow = writePaceBand(profile, "running", band, "maxPace", slow);
    return fast > 0
      ? writePaceBand(withSlow, "running", band, "minPace", fast)
      : withSlow;
  }, freshProfile());
