import { describe, expect, it } from "vitest";

import type { ConnectionFlow } from "./connection-config";
import { deriveConnectionFlows, flowAvailability } from "./flow-availability";

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

const noExportPath: ConnectionFlow = {
  label: "Future export",
  sublabel: "Not yet mapped",
  dataType: "planned-session",
  direction: "export",
};

describe("flowAvailability", () => {
  it.each([
    {
      label: "an import flow whose bridge lacks the read capability is manual",
      flow: importActivities,
      capabilities: ["write:workouts"],
      expected: "manual",
    },
    {
      label:
        "an export flow with the announced write capability is operational",
      flow: exportWorkouts,
      capabilities: ["write:workouts"],
      expected: "operational",
    },
    {
      label: "a readiness import flow lacking read:body is manual",
      flow: importReadiness,
      capabilities: ["write:workouts"],
      expected: "manual",
    },
    {
      label: "a readiness import flow with read:body announced is operational",
      flow: importReadiness,
      capabilities: ["write:workouts", "read:body", "read:sleep"],
      expected: "operational",
    },
    {
      label:
        "an export flow whose required capability is undefined is coming-soon",
      flow: noExportPath,
      capabilities: [],
      expected: "coming-soon",
    },
  ])("should resolve that $label", ({ flow, capabilities, expected }) => {
    // Arrange

    // Act
    const result = flowAvailability(flow, capabilities);

    // Assert
    expect(result).toBe(expected);
  });
});

describe("deriveConnectionFlows", () => {
  it("should derive only garmin's one real operational flow — its 2 aspirational flows disappear", () => {
    // Arrange
    // garmin-bridge announces only write:workouts; it never announced
    // read:workouts or read:body, so those legacy hardcoded flows are
    // gone by construction (intentional per F1.0 consensus, not a bug).

    // Act
    const flows = deriveConnectionFlows(["write:workouts"]);

    // Assert
    expect(flows).toEqual([
      expect.objectContaining({ dataType: "workout", direction: "export" }),
    ]);
  });

  it("should derive six flows for whoop's read:body + read:sleep capabilities (N:1 wire token by design)", () => {
    // Arrange

    // Act
    const flows = deriveConnectionFlows(["read:body", "read:sleep"]);
    const dataTypes = flows.map((f) => f.dataType).sort();

    // Assert
    expect(dataTypes).toEqual(
      [
        "body-composition",
        "daily-wellness",
        "hrv",
        "sleep",
        "stress",
        "weight",
      ].sort()
    );
  });

  it("should derive no flows for a bridge that announces nothing", () => {
    // Arrange

    // Act
    const flows = deriveConnectionFlows([]);

    // Assert
    expect(flows).toEqual([]);
  });

  it("should never derive a flow whose availability resolves to anything but operational", () => {
    // Arrange
    const capabilities = ["write:workouts", "read:body", "read:sleep"];

    // Act
    const flows = deriveConnectionFlows(capabilities);

    // Assert
    for (const flow of flows) {
      expect(flowAvailability(flow, capabilities)).toBe("operational");
    }
  });
});
