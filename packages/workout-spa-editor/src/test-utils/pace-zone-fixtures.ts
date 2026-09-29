/**
 * Pace-zone fixtures (test-only): a workout whose targets are pace ZONES —
 * the shape AI-converted running sessions produce ("Zone 1 · pace") — and a
 * profile with and without the pace zones that resolve them.
 *
 * Running zones are seconds per km (lower is faster): Z1 6:00–7:00/km,
 * Z2 5:00–5:59/km. As m/s: Z1 1000/420–1000/360, Z2 1000/359–1000/300.
 */
import type { KRD } from "@kaiord/core";

import type { Profile } from "../types/profile";
import type { PaceZone } from "../types/sport-zones";

export const RUNNING_PACE_ZONES: PaceZone[] = [
  { zone: 1, name: "Easy", minPace: 360, maxPace: 420, unit: "min_per_km" },
  { zone: 2, name: "Steady", minPace: 300, maxPace: 359, unit: "min_per_km" },
];

export const SWIM_PACE_ZONES: PaceZone[] = [
  { zone: 1, name: "Easy", minPace: 110, maxPace: 125, unit: "min_per_100m" },
  { zone: 2, name: "Steady", minPace: 95, maxPace: 109, unit: "min_per_100m" },
];

/** The m/s ranges the zones above convert to (fastest bound = maxMps). */
export const RUNNING_Z1_MPS = {
  zone: 1,
  minMps: 1000 / 420,
  maxMps: 1000 / 360,
};
export const RUNNING_Z2_MPS = {
  zone: 2,
  minMps: 1000 / 359,
  maxMps: 1000 / 300,
};
export const SWIM_Z1_MPS = { zone: 1, minMps: 100 / 125, maxMps: 100 / 110 };

/** An ad-hoc swim zone of 1:40–2:05/100m, and its m/s range. */
export const SWIM_ZONE_100_125: PaceZone = {
  zone: 1,
  name: "Easy",
  minPace: 100,
  maxPace: 125,
  unit: "min_per_100m",
};
export const SWIM_ZONE_100_125_MPS = { zone: 1, minMps: 100 / 125, maxMps: 1 };

/** An unset zone: the editor's default before bounds are typed. */
export const UNSET_RUNNING_ZONE: PaceZone = {
  zone: 1,
  name: "Z1",
  minPace: 0,
  maxPace: 0,
  unit: "min_per_km",
};

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

/** Z1 warm-up, then 3 × Z2 in a repetition block. */
export const paceZoneKrd = (sport = "running"): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-09-30T08:00:00Z", sport },
    extensions: {
      structured_workout: {
        name: "Zone run",
        sport,
        steps: [
          paceZoneStep(0, 1),
          { repeatCount: 3, steps: [paceZoneStep(1, 2)] },
        ],
      },
    },
  }) as unknown as KRD;

export const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

/** A profile; `pace` sets its running pace zones (none by default). */
export const paceProfile = (pace: PaceZone[] = []): Profile => ({
  id: PROFILE_ID,
  name: "Runner",
  linkedAccounts: [],
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  sportZones: {
    running: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: [] },
      paceZones: { method: "custom", zones: pace },
    },
    swimming: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: [] },
      paceZones: { method: "custom", zones: SWIM_PACE_ZONES },
    },
  },
});
