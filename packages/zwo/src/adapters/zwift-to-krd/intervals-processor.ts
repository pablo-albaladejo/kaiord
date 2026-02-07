import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
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

const normalizeAttributeNames = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    // Remove @_ prefix from attribute names
    const normalizedKey = key.startsWith("@_") ? key.substring(2) : key;
    normalized[normalizedKey] = value;
  }
  return normalized;
};

const processSingleStep = (
  interval: IntervalData,
  stepIndex: number,
  durationType: "time" | "distance"
): ProcessResult => {
  const normalizedData = normalizeAttributeNames(interval.data);
  const data = { ...normalizedData, stepIndex, durationType };

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
  durationType: "time" | "distance"
): ProcessResult => {
  if (interval.type === "IntervalsT") {
    const normalizedData = normalizeAttributeNames(interval.data);
    const repetitionBlock = mapIntervalsTToKrd({
      ...normalizedData,
      stepIndex,
      durationType,
    } as Parameters<typeof mapIntervalsTToKrd>[0]);
    return {
      step: repetitionBlock,
      indexIncrement: repetitionBlock.steps.length,
    };
  }

  return processSingleStep(interval, stepIndex, durationType);
};

export const processIntervals = (
  intervals: Array<IntervalData>,
  durationType: "time" | "distance"
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
