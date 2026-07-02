import { describe, expect, it } from "vitest";

import type { ConnectionFlow } from "./connection-config";
import { flowAvailability } from "./flow-availability";

const importActivities: ConnectionFlow = {
  label: "Completed activities",
  sublabel: "Import finished workouts",
  dataType: "workout",
  direction: "import",
};

const exportWorkouts: ConnectionFlow = {
  label: "Planned workouts",
  sublabel: "Push planned sessions",
  dataType: "workout",
  direction: "export",
};

const importReadiness: ConnectionFlow = {
  label: "Daily readiness (HRV, sleep)",
  sublabel: "Import recovery signals",
  dataType: "hrv",
  direction: "import",
};

describe("flowAvailability", () => {
  it("should mark an import flow as manual when the bridge lacks the read capability", () => {
    // Arrange
    const capabilities = ["write:workouts"];

    // Act
    const result = flowAvailability(importActivities, capabilities);

    // Assert
    expect(result).toBe("manual");
  });

  it("should mark an export flow as operational when the bridge announces the write capability", () => {
    // Arrange
    const capabilities = ["write:workouts"];

    // Act
    const result = flowAvailability(exportWorkouts, capabilities);

    // Assert
    expect(result).toBe("operational");
  });

  it("should mark a readiness import flow as manual when the bridge lacks read:body", () => {
    // Arrange
    const capabilities = ["write:workouts"];

    // Act
    const result = flowAvailability(importReadiness, capabilities);

    // Assert
    expect(result).toBe("manual");
  });

  it("should mark a readiness import flow as operational once the bridge announces read:body", () => {
    // Arrange
    const capabilities = ["write:workouts", "read:body", "read:sleep"];

    // Act
    const result = flowAvailability(importReadiness, capabilities);

    // Assert
    expect(result).toBe("operational");
  });

  it("should mark an export flow as coming-soon when the required capability is undefined", () => {
    // Arrange
    const noExportPath: ConnectionFlow = {
      label: "Future export",
      sublabel: "Not yet mapped",
      dataType: "training-plan",
      direction: "export",
    };

    // Act
    const result = flowAvailability(noExportPath, []);

    // Assert
    expect(result).toBe("coming-soon");
  });
});
