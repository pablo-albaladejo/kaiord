import type { Duration, DurationType, Logger } from "@kaiord/core";

import type { GarminConditionType } from "../schemas/common";
import {
  buildCaloriesCondition,
  buildDistanceCondition,
  buildOpenCondition,
  buildTimeCondition,
} from "./condition-builders.mapper";

type MappedDuration = { durationType: DurationType; duration: Duration };

const OPEN_DURATION: MappedDuration = {
  durationType: "open",
  duration: { type: "open" },
};

export const mapConditionToDuration = (
  conditionTypeKey: string,
  value: number,
  logger?: Logger
): MappedDuration => {
  switch (conditionTypeKey) {
    case "time":
      return {
        durationType: "time",
        duration: { type: "time", seconds: value },
      };
    case "distance":
      return {
        durationType: "distance",
        duration: { type: "distance", meters: value },
      };
    case "calories":
      return {
        durationType: "calories",
        duration: { type: "calories", calories: value },
      };
    case "reps":
      // KRD has no reps-based duration vocabulary; modelling it is out of
      // scope (see design D4). Degrade loudly to open rather than silently.
      logger?.warn(
        "Lossy conversion: reps end-condition not supported, treating as open",
        { conditionTypeKey, value }
      );
      return OPEN_DURATION;
    default:
      logger?.warn(
        "Lossy conversion: unknown end-condition, treating as open",
        { conditionTypeKey, value }
      );
      return OPEN_DURATION;
  }
};

export const mapDurationToCondition = (
  durationType: string,
  duration: Duration,
  logger?: Logger
): { endCondition: GarminConditionType; endConditionValue: number } => {
  switch (durationType) {
    case "time":
      return buildTimeCondition(duration);
    case "distance":
      return buildDistanceCondition(duration);
    case "calories":
      return buildCaloriesCondition(duration);
    case "open":
      return buildOpenCondition();
    default:
      logger?.warn(
        "Lossy conversion: unknown duration type, using lap-button condition",
        { durationType }
      );
      return buildOpenCondition();
  }
};
