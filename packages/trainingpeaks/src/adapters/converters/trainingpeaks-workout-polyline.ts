import type {
  TrainingPeaksBlock,
  TrainingPeaksStep,
} from "../schemas/trainingpeaks-workout.schema";

/**
 * The preview graph TrainingPeaks draws above a structured workout.
 *
 * TrainingPeaks computes this client-side and stores whatever it is sent, so a
 * wrong polyline yields a workout that executes correctly and *looks* wrong.
 * The algorithm below was reverse-engineered from a real capture and is pinned
 * against it in the converter's tests.
 *
 * Coordinates are normalised: `x` is elapsed time over total time, `y` is the
 * step's upper target over the workout's highest upper target. Points come in
 * one leading origin plus a rise/run/fall triplet per expanded step, which is
 * what produces the square profile TrainingPeaks renders.
 */

/** Three decimals — the precision TrainingPeaks itself emits. */
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Flatten repeats: a `repetition` block contributes its steps once per round. */
export const expandBlocks = (
  blocks: readonly TrainingPeaksBlock[]
): TrainingPeaksStep[] => {
  const expanded: TrainingPeaksStep[] = [];
  for (const block of blocks) {
    for (let round = 0; round < block.length.value; round += 1) {
      expanded.push(...block.steps);
    }
  }
  return expanded;
};

/** Total workout duration in seconds, repeats included. */
export const totalSeconds = (blocks: readonly TrainingPeaksBlock[]): number =>
  expandBlocks(blocks).reduce((sum, step) => sum + step.length.value, 0);

/** A step always carries exactly one target; 0 stands in for a dropped one. */
const upperTarget = (step: TrainingPeaksStep): number =>
  step.targets[0]?.maxValue ?? 0;

export const buildPolyline = (
  blocks: readonly TrainingPeaksBlock[]
): [number, number][] => {
  const steps = expandBlocks(blocks);
  const total = totalSeconds(blocks);
  // A workout whose every target was dropped has no intensity to scale by;
  // flattening the graph to zero beats emitting NaN, which the schema rejects.
  const peak = Math.max(...steps.map(upperTarget)) || 1;

  const points: [number, number][] = [[0, 0]];
  let elapsed = 0;
  for (const step of steps) {
    const y = round3(upperTarget(step) / peak);
    const xStart = round3(elapsed / total);
    elapsed += step.length.value;
    const xEnd = round3(elapsed / total);
    points.push([xStart, y], [xEnd, y], [xEnd, 0]);
  }
  return points;
};
