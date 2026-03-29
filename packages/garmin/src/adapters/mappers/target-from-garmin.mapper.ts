import type { Target, TargetType } from "@kaiord/core";

type TargetResult = { targetType: TargetType; target: Target };

const OPEN: TargetResult = { targetType: "open", target: { type: "open" } };

export const mapGarminTargetToKrd = (
  targetTypeKey: string,
  valueOne: number | null,
  valueTwo: number | null,
  zoneNumber: number | null
): TargetResult => {
  switch (targetTypeKey) {
    case "power.zone":
      return mapTarget("power", valueOne, valueTwo, zoneNumber);
    case "heart.rate.zone":
      return mapTarget("heart_rate", valueOne, valueTwo, zoneNumber);
    case "pace.zone":
      return mapTarget("pace", valueOne, valueTwo, zoneNumber);
    case "speed.zone":
      return mapRangeOnly("pace", valueOne, valueTwo);
    case "cadence":
      return mapRangeOnly("cadence", valueOne, valueTwo);
    case "no.target":
    default:
      return OPEN;
  }
};

const mapTarget = <T extends "power" | "heart_rate" | "pace">(
  type: T,
  v1: number | null,
  v2: number | null,
  zone: number | null
): TargetResult => {
  if (zone !== null) {
    return {
      targetType: type,
      target: { type, value: { unit: "zone", value: zone } } as Target,
    };
  }
  return mapRangeOnly(type, v1, v2);
};

const mapRangeOnly = <T extends "power" | "heart_rate" | "pace" | "cadence">(
  type: T,
  v1: number | null,
  v2: number | null
): TargetResult => {
  if (v1 !== null && v2 !== null) {
    return {
      targetType: type,
      target: { type, value: { unit: "range", min: v1, max: v2 } } as Target,
    };
  }
  return OPEN;
};
