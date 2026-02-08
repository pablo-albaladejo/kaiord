import type { ExecutableStepDTOInput } from "./step-input.schema";

export type RepeatGroupDTOInputType = {
  type: "RepeatGroupDTO";
  stepOrder: number;
  stepType: { stepTypeId: number; stepTypeKey: string; displayOrder: number };
  numberOfIterations: number;
  smartRepeat?: boolean;
  endCondition: {
    conditionTypeId: number;
    conditionTypeKey: string;
    displayOrder: number;
    displayable: boolean;
  };
  endConditionValue: number;
  workoutSteps: GarminWorkoutStepInput[];
  childStepId?: number | null;
  description?: string;
};

export type GarminWorkoutStepInput =
  | ExecutableStepDTOInput
  | RepeatGroupDTOInputType;
