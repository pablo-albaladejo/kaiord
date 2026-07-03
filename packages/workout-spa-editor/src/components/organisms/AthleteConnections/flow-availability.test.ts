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

const noExportPath: ConnectionFlow = {
  label: "Future export",
  sublabel: "Not yet mapped",
  dataType: "training-plan",
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
