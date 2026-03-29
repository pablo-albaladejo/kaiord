import { ConditionTypeId } from "../schemas/common";
import type {
  GarminConditionType,
  conditionTypeKeySchema,
} from "../schemas/common";
import type { Duration, DurationType } from "@kaiord/core";
import type { z } from "zod";

export const mapConditionToDuration = (
  conditionTypeKey: string,
  value: number
): { durationType: DurationType; duration: Duration } => {
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
    default:
      return {
        durationType: "open",
        duration: { type: "open" },
      };
  }
};

type ConditionTypeKey = z.infer<typeof conditionTypeKeySchema>;

const buildCondition = (
  id: number,
  key: ConditionTypeKey,
  order: number,
  displayable: boolean
): GarminConditionType => ({
  conditionTypeId: id,
  conditionTypeKey: key,
  displayOrder: order,
  displayable,
});

const buildTimeCondition = (duration: Duration) => ({
  endCondition: buildCondition(ConditionTypeId.TIME, "time", 2, true),
  endConditionValue: "seconds" in duration ? duration.seconds : 0,
});

const buildDistanceCondition = (duration: Duration) => ({
  endCondition: buildCondition(ConditionTypeId.DISTANCE, "distance", 3, true),
  endConditionValue: "meters" in duration ? duration.meters : 0,
});

const buildCaloriesCondition = (duration: Duration) => ({
  endCondition: buildCondition(ConditionTypeId.CALORIES, "calories", 4, true),
  endConditionValue: "calories" in duration ? duration.calories : 0,
});

const buildOpenCondition = () => ({
  endCondition: buildCondition(
    ConditionTypeId.LAP_BUTTON,
    "lap.button",
    1,
    true
  ),
  endConditionValue: 0,
});

export const mapDurationToCondition = (
  durationType: string,
  duration: Duration
): { endCondition: GarminConditionType; endConditionValue: number } => {
  switch (durationType) {
    case "time":
      return buildTimeCondition(duration);
    case "distance":
      return buildDistanceCondition(duration);
    case "calories":
      return buildCaloriesCondition(duration);
    default:
      return buildOpenCondition();
  }
};
