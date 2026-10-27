import { describe, expect, it } from "vitest";

import { isPushFailure } from "./is-push-failure";

describe("isPushFailure", () => {
  it.each([
    [{ error: "push_failed" }, true],
    [{ error: "no_active_export_route", message: "x" }, true],
    [{ workoutId: "w1", garminPushId: "1", calendar: "scheduled" }, false],
    [{ workoutId: "w1", garminPushId: null, calendar: "uncertain" }, false],
    [null, false],
    ["text", false],
  ])("should classify %j as failure=%s", (output, expected) => {
    // Arrange
    const result = output;

    // Act
    const failed = isPushFailure(result);

    // Assert
    expect(failed).toBe(expected);
  });
});
