import type { Target, TargetType } from "@kaiord/core";
import type { GarminTargetType } from "../schemas/common";
import { TargetTypeId } from "../schemas/common";

type GarminTargetInfo = {
  targetType: GarminTargetType;
  targetValueOne: number | null;
  targetValueTwo: number | null;
  zoneNumber: number | null;
};

export const mapGarminTargetToKrd = (
  targetTypeKey: string,
  valueOne: number | null,
  valueTwo: number | null,
  zoneNumber: number | null
): { targetType: TargetType; target: Target } => {
  switch (targetTypeKey) {
    case "power.zone":
      return mapPowerTarget(valueOne, valueTwo, zoneNumber);
    case "heart.rate.zone":
      return mapHeartRateTarget(valueOne, valueTwo, zoneNumber);
    case "pace.zone":
      return mapPaceTarget(valueOne, valueTwo, zoneNumber);
    case "speed.zone":
      return mapSpeedTarget(valueOne, valueTwo, zoneNumber);
    case "cadence":
      return mapCadenceTarget(valueOne, valueTwo);
    case "no.target":
    default:
      return { targetType: "open", target: { type: "open" } };
  }
};

const mapPowerTarget = (
  v1: number | null,
  v2: number | null,
  zone: number | null
): { targetType: TargetType; target: Target } => {
  if (zone !== null) {
    return {
      targetType: "power",
      target: { type: "power", value: { unit: "zone", value: zone } },
    };
  }
  if (v1 !== null && v2 !== null) {
    return {
      targetType: "power",
      target: { type: "power", value: { unit: "range", min: v1, max: v2 } },
    };
  }
  return { targetType: "open", target: { type: "open" } };
};

const mapHeartRateTarget = (
  v1: number | null,
  v2: number | null,
  zone: number | null
): { targetType: TargetType; target: Target } => {
  if (zone !== null) {
    return {
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "zone", value: zone },
      },
    };
  }
  if (v1 !== null && v2 !== null) {
    return {
      targetType: "heart_rate",
      target: {
        type: "heart_rate",
        value: { unit: "range", min: v1, max: v2 },
      },
    };
  }
  return { targetType: "open", target: { type: "open" } };
};

const mapPaceTarget = (
  v1: number | null,
  v2: number | null,
  zone: number | null
): { targetType: TargetType; target: Target } => {
  if (zone !== null) {
    return {
      targetType: "pace",
      target: { type: "pace", value: { unit: "zone", value: zone } },
    };
  }
  if (v1 !== null && v2 !== null) {
    return {
      targetType: "pace",
      target: { type: "pace", value: { unit: "range", min: v1, max: v2 } },
    };
  }
  return { targetType: "open", target: { type: "open" } };
};

const mapSpeedTarget = (
  v1: number | null,
  v2: number | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _zone: number | null
): { targetType: TargetType; target: Target } => {
  if (v1 !== null && v2 !== null) {
    return {
      targetType: "pace",
      target: { type: "pace", value: { unit: "range", min: v1, max: v2 } },
    };
  }
  return { targetType: "open", target: { type: "open" } };
};

const mapCadenceTarget = (
  v1: number | null,
  v2: number | null
): { targetType: TargetType; target: Target } => {
  if (v1 !== null && v2 !== null) {
    return {
      targetType: "cadence",
      target: {
        type: "cadence",
        value: { unit: "range", min: v1, max: v2 },
      },
    };
  }
  return { targetType: "open", target: { type: "open" } };
};

import type { z } from "zod";
import type { targetTypeKeySchema } from "../schemas/common";

type TargetTypeKey = z.infer<typeof targetTypeKeySchema>;

const buildTargetType = (
  id: number,
  key: TargetTypeKey,
  order: number
): GarminTargetType => ({
  workoutTargetTypeId: id,
  workoutTargetTypeKey: key,
  displayOrder: order,
});

export const mapKrdTargetToGarmin = (target: Target): GarminTargetInfo => {
  switch (target.type) {
    case "power":
      return mapKrdPowerToGarmin(target.value);
    case "heart_rate":
      return mapKrdHeartRateToGarmin(target.value);
    case "pace":
      return mapKrdPaceToGarmin(target.value);
    case "cadence":
      return mapKrdCadenceToGarmin(target.value);
    case "open":
    default:
      return {
        targetType: buildTargetType(TargetTypeId.NO_TARGET, "no.target", 1),
        targetValueOne: null,
        targetValueTwo: null,
        zoneNumber: null,
      };
  }
};

const mapKrdPowerToGarmin = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): GarminTargetInfo => {
  const tt = buildTargetType(TargetTypeId.POWER_ZONE, "power.zone", 2);
  if (value.unit === "zone") {
    return {
      targetType: tt,
      targetValueOne: null,
      targetValueTwo: null,
      zoneNumber: value.value ?? null,
    };
  }
  if (value.unit === "range") {
    return {
      targetType: tt,
      targetValueOne: value.min ?? null,
      targetValueTwo: value.max ?? null,
      zoneNumber: null,
    };
  }
  return {
    targetType: tt,
    targetValueOne: value.value ?? null,
    targetValueTwo: value.value ?? null,
    zoneNumber: null,
  };
};

const mapKrdHeartRateToGarmin = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): GarminTargetInfo => {
  const tt = buildTargetType(
    TargetTypeId.HEART_RATE_ZONE,
    "heart.rate.zone",
    4
  );
  if (value.unit === "zone") {
    return {
      targetType: tt,
      targetValueOne: null,
      targetValueTwo: null,
      zoneNumber: value.value ?? null,
    };
  }
  if (value.unit === "range") {
    return {
      targetType: tt,
      targetValueOne: value.min ?? null,
      targetValueTwo: value.max ?? null,
      zoneNumber: null,
    };
  }
  return {
    targetType: tt,
    targetValueOne: value.value ?? null,
    targetValueTwo: value.value ?? null,
    zoneNumber: null,
  };
};

const mapKrdPaceToGarmin = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): GarminTargetInfo => {
  const tt = buildTargetType(TargetTypeId.PACE_ZONE, "pace.zone", 6);
  if (value.unit === "zone") {
    return {
      targetType: tt,
      targetValueOne: null,
      targetValueTwo: null,
      zoneNumber: value.value ?? null,
    };
  }
  if (value.unit === "range") {
    return {
      targetType: tt,
      targetValueOne: value.min ?? null,
      targetValueTwo: value.max ?? null,
      zoneNumber: null,
    };
  }
  return {
    targetType: tt,
    targetValueOne: value.value ?? null,
    targetValueTwo: value.value ?? null,
    zoneNumber: null,
  };
};

const mapKrdCadenceToGarmin = (value: {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
}): GarminTargetInfo => {
  const tt = buildTargetType(TargetTypeId.CADENCE_ZONE, "cadence", 3);
  if (value.unit === "range") {
    return {
      targetType: tt,
      targetValueOne: value.min ?? null,
      targetValueTwo: value.max ?? null,
      zoneNumber: null,
    };
  }
  return {
    targetType: tt,
    targetValueOne: value.value ?? null,
    targetValueTwo: value.value ?? null,
    zoneNumber: null,
  };
};
