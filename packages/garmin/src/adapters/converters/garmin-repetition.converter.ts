import { mapWorkoutStep } from "./garmin-workout-step.converter";
import { ConditionTypeId, StepTypeId } from "../schemas/common";
import type { TargetMapperOptions } from "../mappers/target.mapper";
import type { GarminWorkoutStepInput } from "../schemas/input/types";
import type { RepetitionBlock } from "@kaiord/core";

export const mapRepetitionBlock = (
  block: RepetitionBlock,
  counter: { value: number },
  options?: TargetMapperOptions
): GarminWorkoutStepInput => {
  const stepOrder = counter.value++;
  const innerSteps: GarminWorkoutStepInput[] = block.steps.map((step) =>
    mapWorkoutStep(step, counter, options)
  );

  return {
    type: "RepeatGroupDTO",
    stepOrder,
    stepType: {
      stepTypeId: StepTypeId.REPEAT,
      stepTypeKey: "repeat",
      displayOrder: 6,
    },
    numberOfIterations: block.repeatCount,
    endCondition: {
      conditionTypeId: ConditionTypeId.ITERATIONS,
      conditionTypeKey: "iterations",
      displayOrder: 7,
      displayable: false,
    },
    endConditionValue: block.repeatCount,
    workoutSteps: innerSteps,
  };
};
