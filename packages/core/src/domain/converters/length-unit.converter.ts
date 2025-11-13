import type { LengthUnit } from "../schemas/length-unit";

export const convertLengthToMeters = (
  length: number,
  unit: LengthUnit
): number => {
  if (unit === "yards") {
    return length * 0.9144;
  }

  return length;
};
