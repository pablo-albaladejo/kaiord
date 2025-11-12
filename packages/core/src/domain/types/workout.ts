import type { Duration, DurationType } from "./duration";
import type { Target, TargetType } from "./target";

export type WorkoutStep = {
  stepIndex: number;
  durationType: DurationType;
  duration: Duration;
  targetType: TargetType;
  target: Target;
};

export type RepetitionBlock = {
  repeatCount: number;
  steps: Array<WorkoutStep>;
};

export type Workout = {
  name?: string;
  sport: string;
  steps: Array<WorkoutStep | RepetitionBlock>;
};
