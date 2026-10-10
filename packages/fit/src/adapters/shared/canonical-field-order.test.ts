import { describe, expect, it } from "vitest";

import { orderFieldsByProfile } from "./canonical-field-order";
import { FIT_MESSAGE_NUMBERS } from "./message-numbers";

const STEP = FIT_MESSAGE_NUMBERS.WORKOUT_STEP;

describe("orderFieldsByProfile", () => {
  it("should order profile fields by field number and keep other keys last", () => {
    // Arrange
    const message = {
      mesgNum: STEP,
      intensity: "active",
      targetType: "open",
      durationType: "time",
      messageIndex: 0,
      durationTime: 60,
    };

    // Act
    const result = orderFieldsByProfile(STEP, message);

    // Assert
    expect(Object.keys(result)).toStrictEqual([
      "durationType",
      "targetType",
      "intensity",
      "messageIndex",
      "mesgNum",
      "durationTime",
    ]);
  });

  it("should give two messages with the same fields the same key order", () => {
    // Arrange
    const first = { durationType: "time", targetType: "open" };
    const second = { targetType: "open", durationType: "time" };

    // Act
    const a = orderFieldsByProfile(STEP, first);
    const b = orderFieldsByProfile(STEP, second);

    // Assert
    expect(Object.keys(a)).toStrictEqual(Object.keys(b));
    expect(b).toStrictEqual(second);
  });

  it("should leave a message of an unknown message number unchanged", () => {
    // Arrange
    const unknownMesgNum = 65000;
    const message = { b: 1, a: 2 };

    // Act
    const result = orderFieldsByProfile(unknownMesgNum, message);

    // Assert
    expect(Object.keys(result)).toStrictEqual(["b", "a"]);
  });
});
