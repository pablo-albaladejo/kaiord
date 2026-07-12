import { describe, expect, it } from "vitest";

import { toggleDashboardParam } from "./toggle-dashboard-param";

describe("toggleDashboardParam", () => {
  it.each([
    {
      scenario: "pin a parameter when the current selection is undefined",
      current: undefined,
      parameterKey: "glucose",
      expected: ["glucose"],
    },
    {
      scenario: "pin a parameter not yet selected, appending it",
      current: ["glucose"],
      parameterKey: "ferritin",
      expected: ["glucose", "ferritin"],
    },
    {
      scenario: "unpin an already pinned parameter",
      current: ["glucose", "ferritin"],
      parameterKey: "glucose",
      expected: ["ferritin"],
    },
  ])("should $scenario", ({ current, parameterKey, expected }) => {
    // Arrange

    // Act
    const next = toggleDashboardParam(current, parameterKey);

    // Assert
    expect(next).toEqual(expected);
  });

  it("should not mutate the input array", () => {
    // Arrange
    const current = ["glucose"];

    // Act
    toggleDashboardParam(current, "ferritin");

    // Assert
    expect(current).toEqual(["glucose"]);
  });

  it("should return to the original selection after pin then unpin", () => {
    // Arrange
    const current = ["glucose"];

    // Act
    const afterPin = toggleDashboardParam(current, "creatinine");
    const afterUnpin = toggleDashboardParam(afterPin, "creatinine");

    // Assert
    expect(afterUnpin).toEqual(current);
  });
});
