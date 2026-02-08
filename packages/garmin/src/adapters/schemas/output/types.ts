import type { ExecutableStepDTO } from "./step.schema";

export type RepeatGroupDTOType = {
  type: "RepeatGroupDTO";
  stepId: number;
  stepOrder: number;
  stepType: { stepTypeId: number; stepTypeKey: string; displayOrder: number };
  childStepId: number | null;
  numberOfIterations: number;
  smartRepeat: boolean | null;
  skipLastRestStep: boolean | null;
  endCondition: {
    conditionTypeId: number;
    conditionTypeKey: string;
    displayOrder: number;
    displayable: boolean;
  };
  endConditionValue: number;
  preferredEndConditionUnit: {
    unitId: number | null;
    unitKey: string | null;
    factor: number | null;
  } | null;
  endConditionCompare: number | null;
  workoutSteps: GarminWorkoutStep[];
  description: string | null;
};

export type GarminWorkoutStep = ExecutableStepDTO | RepeatGroupDTOType;
