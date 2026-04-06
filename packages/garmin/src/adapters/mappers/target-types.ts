import type { z } from "zod";

import type { GarminTargetType, targetTypeKeySchema } from "../schemas/common";

export type GarminTargetInfo = {
  targetType: GarminTargetType;
  targetValueOne: number | null;
  targetValueTwo: number | null;
  zoneNumber: number | null;
};

export type PaceZoneEntry = {
  zone: number;
  minMps: number;
  maxMps: number;
};

export type PaceZoneTable = PaceZoneEntry[];

export type TargetMapperOptions = {
  paceZones?: PaceZoneTable;
};

type TargetTypeKey = z.infer<typeof targetTypeKeySchema>;

export const buildTargetType = (
  id: number,
  key: TargetTypeKey,
  order: number
): GarminTargetType => ({
  workoutTargetTypeId: id,
  workoutTargetTypeKey: key,
  displayOrder: order,
});
