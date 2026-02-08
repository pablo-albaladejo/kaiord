import type { Duration, DurationType } from "@kaiord/core";
import type { GarminConditionType } from "../schemas/common";
import { ConditionTypeId } from "../schemas/common";

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
    case "lap.button":
      return {
        durationType: "open",
        duration: { type: "open" },
      };
    case "reps":
      return {
        durationType: "open",
        duration: { type: "open" },
      };
    default:
      return {
        durationType: "open",
        duration: { type: "open" },
      };
  }
};

import type { z } from "zod";
import type { conditionTypeKeySchema } from "../schemas/common";

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

export const mapDurationToCondition = (
  durationType: string,
  duration: Duration
): { endCondition: GarminConditionType; endConditionValue: number } => {
  switch (durationType) {
    case "time":
      return {
        endCondition: buildCondition(ConditionTypeId.TIME, "time", 2, true),
        endConditionValue: "seconds" in duration ? duration.seconds : 0,
      };
    case "distance":
      return {
        endCondition: buildCondition(
          ConditionTypeId.DISTANCE,
          "distance",
          3,
          true
        ),
        endConditionValue: "meters" in duration ? duration.meters : 0,
      };
    case "calories":
      return {
        endCondition: buildCondition(
          ConditionTypeId.CALORIES,
          "calories",
          4,
          true
        ),
        endConditionValue: "calories" in duration ? duration.calories : 0,
      };
    case "open":
    default:
      return {
        endCondition: buildCondition(
          ConditionTypeId.LAP_BUTTON,
          "lap.button",
          1,
          true
        ),
        endConditionValue: 0,
      };
  }
};
