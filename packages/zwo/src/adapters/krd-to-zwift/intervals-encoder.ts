import type { Logger, RepetitionBlock, WorkoutStep } from "@kaiord/core";

import { detectIntervalType } from "../interval/interval-type-detector";
import { encodeIntervalsT } from "./intervals-t-encoder";
import type { OrderedNode } from "./ordered-xml";
import { toOrderedNode } from "./ordered-xml";
import { convertStepToInterval } from "./step-encoder";

const INTERVALS_T_STEP_TYPES = new Set(["SteadyState", "FreeRide"]);

const encodeStep = (step: WorkoutStep, logger?: Logger): OrderedNode => {
  const intervalType = detectIntervalType(step);
  return toOrderedNode(
    intervalType,
    convertStepToInterval(step, intervalType, logger)
  );
};

// IntervalsT is one on/off pair of constant targets; ramps or any other step
// count only survive as the block's steps written out repeatCount times.
const fitsIntervalsT = (block: RepetitionBlock): boolean =>
  block.steps.length === 2 &&
  block.steps.every((step) =>
    INTERVALS_T_STEP_TYPES.has(detectIntervalType(step))
  );

const encodeRepetitionBlock = (
  block: RepetitionBlock,
  logger?: Logger
): Array<OrderedNode> => {
  if (fitsIntervalsT(block)) {
    return [toOrderedNode("IntervalsT", encodeIntervalsT(block, logger))];
  }

  logger?.warn(
    "Lossy conversion: repetition block unrolled, Zwift IntervalsT only supports constant on/off pairs",
    { repeatCount: block.repeatCount, stepCount: block.steps.length }
  );
  return Array.from({ length: block.repeatCount }, () =>
    block.steps.map((step) => encodeStep(step, logger))
  ).flat();
};

export const convertStepsToZwiftIntervals = (
  steps: Array<WorkoutStep | RepetitionBlock>,
  logger?: Logger
): Array<OrderedNode> =>
  steps.flatMap((step) =>
    "repeatCount" in step
      ? encodeRepetitionBlock(step, logger)
      : [encodeStep(step, logger)]
  );
