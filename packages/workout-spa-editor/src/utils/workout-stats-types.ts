export type WorkoutStats = {
  totalDuration: number | null;
  totalDistance: number | null;
  hasOpenSteps: boolean;
  stepCount: number;
  repetitionCount: number;
};

export type StatsAccumulator = {
  totalDuration: number;
  totalDistance: number;
  hasOpenSteps: boolean;
  canCalculateDuration: boolean;
  canCalculateDistance: boolean;
  stepCount: number;
  repetitionCount: number;
};
