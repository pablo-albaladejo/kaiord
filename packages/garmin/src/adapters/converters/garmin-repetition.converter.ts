import type { RepetitionBlock } from "@kaiord/core";
import type { GarminWorkoutStepInput } from "../schemas/input/types";
import { ConditionTypeId, StepTypeId } from "../schemas/common";
import { mapWorkoutStep } from "./garmin-workout-step.converter";

export const mapRepetitionBlock = (
  block: RepetitionBlock,
  counter: { value: number }
): GarminWorkoutStepInput => {
  const stepOrder = counter.value++;
  const innerSteps: GarminWorkoutStepInput[] = block.steps.map((step) =>
    mapWorkoutStep(step, counter)
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
