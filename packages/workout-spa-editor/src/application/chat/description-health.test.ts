import { describe, expect, it } from "vitest";

import { DATA_FLOWS, healthKindsOf } from "../data-flows/data-flows";
import { descriptionHealth } from "./description-health";

describe("descriptionHealth", () => {
  it("should count every health kind the turn sent, counted or declared, and only those its flow declares", () => {
    // Arrange
    const sent = [
      {
        to: "anthropic" as const,
        kinds: ["messages" as const, "hrv" as const],
      },
      {
        to: "anthropic" as const,
        kinds: ["messages" as const],
        declared: healthKindsOf("assistant"),
      },
    ];
    const declared: readonly string[] = DATA_FLOWS.assistantWorkout.kinds;

    // Act
    const { kinds } = descriptionHealth(sent, "openai");

    // Assert
    expect(kinds).toContain("hrv");
    expect(kinds).toContain("energyBalance");
    expect(kinds.filter((kind) => !declared.includes(kind))).toEqual([]);
  });

  it("should say the health data is already at the Provider that received it in this turn", () => {
    // Arrange
    const sent = [{ to: "anthropic" as const, kinds: ["sleep" as const] }];

    // Act
    const same = descriptionHealth(sent, "anthropic");
    const other = descriptionHealth(sent, "google");

    // Assert
    expect(same.alreadyAt).toBe(true);
    expect(other).toEqual({ kinds: ["sleep"], alreadyAt: false });
  });

  it("should find nothing in a turn that sent no health data", () => {
    // Arrange
    const sent = [{ to: "anthropic" as const, kinds: ["messages" as const] }];

    // Act
    const result = descriptionHealth(sent, "openai");

    // Assert
    expect(result).toEqual({ kinds: [], alreadyAt: false });
  });
});
