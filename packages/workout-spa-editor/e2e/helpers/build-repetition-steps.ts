import type { RepetitionBlock } from "./load-test-workout-with-blocks";

/** Build a single repetition block step object for KRD test data. */
export function buildRepetitionSteps(block: RepetitionBlock, index: number) {
  const sport = block.sport ?? "cycling";
  const isCycling = sport === "cycling";

  const target = isCycling
    ? {
        type: "power",
        value: { unit: "watts", value: block.targetWatts ?? 200 },
      }
    : {
        type: "pace",
        value: { unit: "min_per_km", value: block.targetPace ?? 5.0 },
      };

  return {
    repeatCount: block.repeatCount,
    steps: [
      {
        stepIndex: index,
        durationType: "time",
        duration: { type: "time", seconds: block.durationSeconds ?? 60 },
        targetType: isCycling ? "power" : "pace",
        target,
        intensity: "active",
      },
    ],
  };
}
