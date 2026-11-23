import { describe, expect, it } from "vitest";

import type { ParsedExecutableStep } from "../schemas/garmin-workout-parse.schema";
import { equipmentKeyOf, strokeKeyOf } from "./garmin-type-key.converter";

const step = (extra: Partial<ParsedExecutableStep>): ParsedExecutableStep => ({
  type: "ExecutableStepDTO",
  stepType: { stepTypeKey: "interval" },
  endCondition: { conditionTypeKey: "time" },
  endConditionValue: 60,
  targetType: { workoutTargetTypeKey: "no.target" },
  ...extra,
});

describe("strokeKeyOf and equipmentKeyOf", () => {
  it("should prefer the key the step names, even a null one", () => {
    // Arrange
    const named = step({
      strokeType: { strokeTypeKey: "fly", strokeTypeId: 2 },
      equipmentType: { equipmentTypeKey: null, equipmentTypeId: 1 },
    });

    // Act
    const keys = [strokeKeyOf(named), equipmentKeyOf(named)];

    // Assert
    expect(keys).toEqual(["fly", null]);
  });

  it("should read the key of the Garmin id when the step names no key", () => {
    // Arrange
    const ids = step({
      strokeType: { strokeTypeId: 6 },
      equipmentType: { equipmentTypeId: 4 },
    });

    // Act
    const keys = [strokeKeyOf(ids), equipmentKeyOf(ids)];

    // Assert
    expect(keys).toEqual(["free", "pull_buoy"]);
  });

  it("should read no key for no stroke and no equipment", () => {
    // Arrange
    const none = step({
      strokeType: { strokeTypeId: 0 },
      equipmentType: { equipmentTypeId: 0 },
    });

    // Act
    const keys = [
      strokeKeyOf(none),
      equipmentKeyOf(none),
      strokeKeyOf(step({})),
    ];

    // Assert
    expect(keys).toEqual([null, null, null]);
  });
});
