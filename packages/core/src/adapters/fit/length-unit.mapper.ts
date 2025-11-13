import {
  lengthUnitEnum,
  type LengthUnit,
} from "../../domain/schemas/length-unit";

const FIT_LENGTH_UNIT_MAP: Record<number, LengthUnit> = {
  0: "meters",
  1: "yards",
};

export const mapLengthUnitToKrd = (fitUnit: number | undefined): LengthUnit => {
  if (fitUnit === undefined) {
    return lengthUnitEnum.enum.meters;
  }

  return FIT_LENGTH_UNIT_MAP[fitUnit] || lengthUnitEnum.enum.meters;
};

export const mapLengthUnitToFit = (krdUnit: LengthUnit): number => {
  if (krdUnit === lengthUnitEnum.enum.yards) {
    return 1;
  }

  return 0;
};
