import type {
  RepetitionBlock,
  WorkoutStep,
} from "../../../domain/schemas/workout";
import { mapFreeRideToKrd } from "../interval/free-ride.mapper";
import { mapIntervalsTToKrd } from "../interval/intervals-t.mapper";
import {
  mapCooldownToKrd,
  mapRampToKrd,
  mapWarmupToKrd,
} from "../interval/ramp.mapper";
import { mapSteadyStateToKrd } from "../interval/steady-state.mapper";

type IntervalData = { type: string; data: Record<string, unknown> };
type ProcessResult = {
  step: WorkoutStep | RepetitionBlock;
  indexIncrement: number;
};

const processSingleStep = (
  interval: IntervalData,
  stepIndex: number,
  durationType: string
): ProcessResult => {
  const data = { ...interval.data, stepIndex, durationType };

  if (interval.type === "SteadyState") {
    return { step: mapSteadyStateToKrd(data), indexIncrement: 1 };
  } else if (interval.type === "Warmup") {
    return { step: mapWarmupToKrd(data), indexIncrement: 1 };
  } else if (interval.type === "Ramp") {
    return { step: mapRampToKrd(data), indexIncrement: 1 };
  } else if (interval.type === "Cooldown") {
    return { step: mapCooldownToKrd(data), indexIncrement: 1 };
  } else if (interval.type === "FreeRide") {
    return { step: mapFreeRideToKrd(data), indexIncrement: 1 };
  }

  throw new Error(`Unknown interval type: ${interval.type}`);
};

const processInterval = (
  interval: IntervalData,
  stepIndex: number,
  durationType: string
): ProcessResult => {
  if (interval.type === "IntervalsT") {
    const repetitionBlock = mapIntervalsTToKrd({
      ...interval.data,
      stepIndex,
      durationType,
    });
    return {
      step: repetitionBlock,
      indexIncrement: repetitionBlock.steps.length,
    };
  }

  return processSingleStep(interval, stepIndex, durationType);
};

export const processIntervals = (
  intervals: Array<IntervalData>,
  durationType: string
): Array<WorkoutStep | RepetitionBlock> => {
  const steps: Array<WorkoutStep | RepetitionBlock> = [];
  let stepIndex = 0;

  for (const interval of intervals) {
    const result = processInterval(interval, stepIndex, durationType);
    steps.push(result.step);
    stepIndex += result.indexIncrement;
  }

  return steps;
};
