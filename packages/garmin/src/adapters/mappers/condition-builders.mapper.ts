import type { Duration } from "@kaiord/core";
import type { z } from "zod";

import type {
  conditionTypeKeySchema,
  GarminConditionType,
} from "../schemas/common";
import { ConditionTypeId } from "../schemas/common";

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

export const buildTimeCondition = (duration: Duration) => ({
  endCondition: buildCondition(ConditionTypeId.TIME, "time", 2, true),
  endConditionValue: "seconds" in duration ? duration.seconds : 0,
});

export const buildDistanceCondition = (duration: Duration) => ({
  endCondition: buildCondition(ConditionTypeId.DISTANCE, "distance", 3, true),
  endConditionValue: "meters" in duration ? duration.meters : 0,
});

export const buildCaloriesCondition = (duration: Duration) => ({
  endCondition: buildCondition(ConditionTypeId.CALORIES, "calories", 4, true),
  endConditionValue: "calories" in duration ? duration.calories : 0,
});

export const buildOpenCondition = () => ({
  endCondition: buildCondition(
    ConditionTypeId.LAP_BUTTON,
    "lap.button",
    1,
    true
  ),
  endConditionValue: 0,
});
