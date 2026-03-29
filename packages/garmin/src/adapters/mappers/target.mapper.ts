export type {
  GarminTargetInfo,
  PaceZoneEntry,
  PaceZoneTable,
  TargetMapperOptions,
} from "./target-types";
export { buildTargetType } from "./target-types";
export { mapGarminTargetToKrd } from "./target-from-garmin.mapper";
export { mapKrdTargetToGarmin } from "./target-to-garmin.mapper";
