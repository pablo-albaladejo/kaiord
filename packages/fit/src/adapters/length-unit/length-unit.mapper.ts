import { lengthUnitSchema, type LengthUnit } from "@kaiord/core";

const FIT_LENGTH_UNIT_MAP: Record<number, LengthUnit> = {
  0: "meters",
  1: "yards",
};

export const mapLengthUnitToKrd = (fitUnit: number | undefined): LengthUnit => {
  if (fitUnit === undefined) {
    return lengthUnitSchema.enum.meters;
  }

  return FIT_LENGTH_UNIT_MAP[fitUnit] || lengthUnitSchema.enum.meters;
};

export const mapLengthUnitToFit = (krdUnit: LengthUnit): number => {
  if (krdUnit === lengthUnitSchema.enum.yards) {
    return 1;
  }

  return 0;
};
