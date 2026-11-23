import type { Duration } from "../domain/schemas/duration";
import type { KRD } from "../domain/schemas/krd";
import type { Target } from "../domain/schemas/target";
import type { RepetitionBlock, WorkoutStep } from "../domain/schemas/workout";

export const roundTripStep = (
  duration: Duration,
  target: Target,
  extra: Partial<WorkoutStep> = {}
): WorkoutStep => ({
  stepIndex: 0,
  durationType: duration.type,
  duration,
  targetType: target.type,
  target,
  intensity: "active",
  ...extra,
});

export const roundTripWorkout = (
  sport: string,
  steps: Array<WorkoutStep | RepetitionBlock>,
  extra: Record<string, unknown> = {}
): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2024-01-01T00:00:00.000Z", sport },
  extensions: {
    structured_workout: { name: "Round-trip", sport, steps, ...extra },
  },
});

const OPEN: Target = { type: "open" };
const HR_ZONE: Target = {
  type: "heart_rate",
  value: { unit: "zone", value: 4 },
};
const secs = (seconds: number): Duration => ({ type: "time", seconds });

/**
 * A workout with what every structured workout carries: a name, notes and a
 * sub-sport, a named warm-up with step notes, a repeat block, a cool-down.
 */
export const buildStructureWorkout = (): KRD =>
  roundTripWorkout(
    "cycling",
    [
      roundTripStep(secs(600), OPEN, {
        intensity: "warmup",
        name: "Warm up",
        notes: "Spin easy",
      }),
      {
        repeatCount: 3,
        steps: [
          roundTripStep(secs(60), HR_ZONE, { stepIndex: 1, name: "Hard" }),
          roundTripStep(secs(60), OPEN, { stepIndex: 2, intensity: "rest" }),
        ],
      },
      roundTripStep(secs(300), OPEN, { stepIndex: 3, intensity: "cooldown" }),
    ],
    {
      name: "Threshold set",
      notes: "Stay seated on the hard reps.",
      subSport: "indoor_cycling",
    }
  );

/** A pool swim: pool length, a stroke target and swim equipment. */
export const buildSwimWorkout = (): KRD =>
  roundTripWorkout(
    "swimming",
    [
      roundTripStep(
        { type: "distance", meters: 100 },
        { type: "stroke_type", value: { unit: "swim_stroke", value: 0 } },
        { equipment: "swim_fins" }
      ),
    ],
    { poolLength: 25, poolLengthUnit: "meters" }
  );

/** A recorded activity: what a workout writer refuses, so no Round-trip covers it. */
export const buildRecordedActivity = (): KRD => ({
  version: "1.0",
  type: "recorded_activity",
  metadata: { created: "2024-01-01T00:00:00.000Z", sport: "cycling" },
  records: [{ timestamp: "2024-01-01T00:00:01.000Z", heartRate: 120 }],
});
