import type { Workout } from "@kaiord/core";

export type PoolInput = {
  poolLength?: number;
  poolLengthUnit?: { unitId: number; unitKey: string; factor: number };
};

export const addPoolInfo = (workout: Workout, input: PoolInput): void => {
  if (workout.poolLength && workout.poolLength > 0) {
    input.poolLength = workout.poolLength;
    input.poolLengthUnit = {
      unitId: 1,
      unitKey: "meter",
      factor: 100,
    };
  }
};
