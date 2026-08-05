import { describe, expect, it } from "vitest";

import type { WorkoutState } from "../../../types/calendar-enums";
import { resolveRibbonContent } from "./ribbon-content";
import type { GarminGate } from "./use-garmin-gate";

const BROKEN_GATES: Exclude<GarminGate, "ready">[] = [
  "no-extension",
  "export-disabled",
  "no-session",
];

describe("resolveRibbonContent", () => {
  it("should say nothing when the watch already has this version", () => {
    // Arrange
    const state: WorkoutState = "pushed";

    // Act
    const content = resolveRibbonContent("ready", state);

    // Assert
    expect(content).toBeNull();
  });

  it("should say nothing for states that cannot be sent at all", () => {
    // Arrange
    const states: WorkoutState[] = ["raw", "skipped"];

    // Act
    const contents = states.map((s) => resolveRibbonContent("ready", s));

    // Assert
    expect(contents).toEqual([null, null]);
  });

  it("should offer the send from structured without asking for an accept first", () => {
    // Arrange
    const state: WorkoutState = "structured";

    // Act
    const content = resolveRibbonContent("ready", state);

    // Assert
    expect(content?.headlineKey).toBe("ribbon.sendReady");
    expect(content?.fixLabelKey).toBeUndefined();
  });

  it("should name the staleness rather than the re-push when edits outran the watch", () => {
    // Arrange
    const state: WorkoutState = "modified";

    // Act
    const content = resolveRibbonContent("ready", state);

    // Assert
    expect(content?.headlineKey).toBe("ribbon.staleHeadline");
    expect(content?.fixLabelKey).toBeUndefined();
  });

  it("should render every broken gate with a fix, including the one that used to render nothing", () => {
    // Arrange
    const state: WorkoutState = "structured";

    // Act
    const contents = BROKEN_GATES.map((gate) =>
      resolveRibbonContent(gate, state)
    );

    // Assert
    expect(contents.map((c) => c?.fixLabelKey)).toEqual([
      "ribbon.noBridgeAction",
      "ribbon.exportOffAction",
      "ribbon.noSessionAction",
    ]);
  });

  it("should stay silent about a broken gate when nothing needs sending", () => {
    // Arrange
    const state: WorkoutState = "pushed";

    // Act
    const contents = BROKEN_GATES.map((gate) =>
      resolveRibbonContent(gate, state)
    );

    // Assert
    expect(contents).toEqual([null, null, null]);
  });
});
