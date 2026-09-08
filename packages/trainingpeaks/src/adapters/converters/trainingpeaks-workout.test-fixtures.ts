import type { Workout } from "@kaiord/core";

/**
 * A structured workout captured verbatim from
 * `POST /fitness/v6/athletes/{id}/workouts` — a run with a warm-up, a steady
 * block, a four-step ramp and a cool-down — plus the `polyline` and
 * `totalTimePlanned` TrainingPeaks stored for it.
 *
 * Expressing the KRD side in watts over an FTP of 100 reproduces the capture's
 * percentages one-for-one, so the converter can be pinned against real API
 * output rather than against its own arithmetic.
 */

export const CAPTURE_FTP_WATTS = 100;

const wattsStep = (
  stepIndex: number,
  name: string,
  seconds: number,
  [min, max]: readonly [number, number],
  intensity: "warmup" | "active" | "cooldown"
) => ({
  stepIndex,
  name,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds },
  targetType: "power" as const,
  target: {
    type: "power" as const,
    value: { unit: "range" as const, min, max },
  },
  intensity,
});

const RAMP_BANDS = [
  [75, 85],
  [85, 95],
  [95, 105],
  [105, 115],
] as const;

const WARM_UP_BAND = [70, 80] as const;
const STEADY_BAND = [105, 115] as const;

export const CAPTURED_WORKOUT: Workout = {
  name: "Captured",
  sport: "running",
  steps: [
    wattsStep(0, "Warm up", 1200, WARM_UP_BAND, "warmup"),
    wattsStep(1, "Active", 600, STEADY_BAND, "active"),
    ...RAMP_BANDS.map((bands, i) => wattsStep(2 + i, "", 180, bands, "active")),
    wattsStep(6, "Cool down", 600, WARM_UP_BAND, "cooldown"),
  ],
};

/** The 22 points TrainingPeaks stored, transcribed from the capture. */
export const CAPTURED_POLYLINE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, 0.696],
  [0.385, 0.696],
  [0.385, 0],
  [0.385, 1],
  [0.577, 1],
  [0.577, 0],
  [0.577, 0.739],
  [0.635, 0.739],
  [0.635, 0],
  [0.635, 0.826],
  [0.692, 0.826],
  [0.692, 0],
  [0.692, 0.913],
  [0.75, 0.913],
  [0.75, 0],
  [0.75, 1],
  [0.808, 1],
  [0.808, 0],
  [0.808, 0.696],
  [1, 0.696],
  [1, 0],
];

/** `totalTimePlanned` from the capture — fractional HOURS, not seconds. */
export const CAPTURED_TOTAL_TIME_PLANNED_HOURS = 0.8666666666666667;
