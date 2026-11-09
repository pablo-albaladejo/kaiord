import { describe, expect, it } from "vitest";

import { isRouteEnabled } from "./is-route-enabled";

describe("isRouteEnabled", () => {
  it("should be true when the bridge has an enabled route", () => {
    // Arrange
    const policies = [
      { bridgeId: "garmin-bridge", enabled: false },
      { bridgeId: "whoop-bridge", enabled: true },
    ];

    // Act
    const enabled = isRouteEnabled(policies, "whoop-bridge");

    // Assert
    expect(enabled).toBe(true);
  });

  it("should be false when the bridge's route is disabled", () => {
    // Arrange
    const policies = [
      { bridgeId: "garmin-bridge", enabled: false },
      { bridgeId: "whoop-bridge", enabled: true },
    ];

    // Act
    const enabled = isRouteEnabled(policies, "garmin-bridge");

    // Assert
    expect(enabled).toBe(false);
  });

  it("should be false when the bridge has no route", () => {
    // Arrange
    const policies = [{ bridgeId: "whoop-bridge", enabled: true }];

    // Act
    const enabled = isRouteEnabled(policies, "tanita-bridge");

    // Assert
    expect(enabled).toBe(false);
  });
});
