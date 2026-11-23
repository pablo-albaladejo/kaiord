import { describe, expect, it } from "vitest";

import { buildDataFlowInventory } from "./build-inventory";
import { DATA_FLOW_IDS } from "./data-flows";
import { DESTINATION_IDS } from "./destinations";

describe("buildDataFlowInventory", () => {
  it("should list every destination once and every flow under each destination it reaches", () => {
    // Arrange
    const active = () => false;

    // Act
    const groups = buildDataFlowInventory(active);
    const destinations = groups.flatMap((g) => g.destinations);
    const flowPairs = destinations.flatMap((d) =>
      d.flows.map((f) => `${f.id}>${d.id}`)
    );

    // Assert
    expect(destinations.map((d) => d.id).sort()).toEqual(
      [...DESTINATION_IDS].sort()
    );
    expect(new Set(flowPairs.map((p) => p.split(">")[0]))).toEqual(
      new Set(DATA_FLOW_IDS)
    );
    expect(flowPairs).toContain("labImport>google");
    expect(flowPairs).toContain("garminBody>garmin");
    expect(flowPairs).not.toContain("garminBody>trainingpeaks");
  });

  it("should group Providers, Platforms, services and analytics in that order", () => {
    // Arrange
    const active = () => false;

    // Act
    const groups = buildDataFlowInventory(active).map((g) => g.group);

    // Assert
    expect(groups).toEqual(["provider", "platform", "service", "analytics"]);
  });

  it("should say which destinations are set up for this athlete now", () => {
    // Arrange
    const active = (id: string) => id === "anthropic" || id === "drive";

    // Act
    const destinations = buildDataFlowInventory(active).flatMap(
      (g) => g.destinations
    );

    // Assert
    expect(destinations.filter((d) => d.active).map((d) => d.id)).toEqual([
      "anthropic",
      "drive",
    ]);
  });

  it("should list a Provider's health data among the assistant's kinds", () => {
    // Arrange
    const active = () => true;

    // Act
    const anthropic = buildDataFlowInventory(active)
      .flatMap((g) => g.destinations)
      .find((d) => d.id === "anthropic");

    // Assert
    expect(anthropic?.flows.find((f) => f.id === "assistant")?.kinds).toEqual(
      expect.arrayContaining(["sleep", "weight", "hrv", "meals"])
    );
  });
});
