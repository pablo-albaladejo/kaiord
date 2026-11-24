import { describe, expect, it } from "vitest";

import { GARMIN_LIBRARY_DELETES } from "./garmin-library-deletes-switch";
import { buildPlacementDeps } from "./garmin-placement-deps";

// The owner turns library deletes on only after the live capture (design
// "Library deletes off until the owner's capture, 2026-11-24"). Turning the
// switch on fails this test on purpose: that change is the owner's, made
// with this test, never by accident.
describe("the production placement deps", () => {
  it("should keep the library delete switch off", () => {
    // Arrange
    const switchValue = GARMIN_LIBRARY_DELETES;

    // Act
    const isOn = switchValue === true;

    // Assert
    expect(isOn).toBe(false);
  });

  it("should hand the placement pipeline no library port while the switch is off", () => {
    // Arrange
    const features = ["calendar-write-v1", "calendar-find-v1"];

    // Act
    const deps = buildPlacementDeps(features);

    // Assert
    expect(deps).not.toHaveProperty("library");
    expect(deps.library).toBeUndefined();
  });
});
