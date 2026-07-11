import { describe, expect, it } from "vitest";

import { toggleDashboardParam } from "./toggle-dashboard-param";

describe("toggleDashboardParam", () => {
  it("should pin a parameter when the current selection is undefined", () => {
    // Arrange

    // Act
    const next = toggleDashboardParam(undefined, "glucose");

    // Assert
    expect(next).toEqual(["glucose"]);
  });

  it("should pin a parameter not yet selected, appending it", () => {
    // Arrange
    const current = ["glucose"];

    // Act
    const next = toggleDashboardParam(current, "ferritin");

    // Assert
    expect(next).toEqual(["glucose", "ferritin"]);
  });

  it("should unpin an already pinned parameter", () => {
    // Arrange
    const current = ["glucose", "ferritin"];

    // Act
    const next = toggleDashboardParam(current, "glucose");

    // Assert
    expect(next).toEqual(["ferritin"]);
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
