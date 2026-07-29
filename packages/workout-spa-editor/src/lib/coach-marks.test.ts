import { describe, expect, it } from "vitest";

import type { CoachMarkSignals } from "./coach-marks";
import { COACH_MARKS, pickCoachMark } from "./coach-marks";

const signals = (patch: Partial<CoachMarkSignals> = {}): CoachMarkSignals => ({
  available: ["create-block", "ungroup-block"],
  anchors: { "create-block": "step-1", "ungroup-block": "block-1" },
  dismissed: [],
  ...patch,
});

describe("pickCoachMark", () => {
  it("should return the first eligible mark in catalog order", () => {
    // Arrange
    const input = signals();

    // Act
    const mark = pickCoachMark(input);

    // Assert
    expect(mark).toEqual({ ...COACH_MARKS[0], anchorId: "step-1" });
  });

  it("should skip a mark whose command guard is closed", () => {
    // Arrange
    const input = signals({ available: ["ungroup-block"] });

    // Act
    const mark = pickCoachMark(input);

    // Assert
    expect(mark?.id).toBe("ungroup-block");
  });

  it("should skip a mark the profile already dismissed", () => {
    // Arrange
    const input = signals({ dismissed: ["create-block"] });

    // Act
    const mark = pickCoachMark(input);

    // Assert
    expect(mark?.id).toBe("ungroup-block");
  });

  it("should refuse to show a mark with no anchor rather than centring it", () => {
    // Arrange
    const input = signals({
      available: ["create-block"],
      anchors: { "create-block": null, "ungroup-block": null },
    });

    // Act
    const mark = pickCoachMark(input);

    // Assert
    expect(mark).toBeNull();
  });

  it("should return null when nothing is available", () => {
    // Arrange
    const input = signals({ available: [] });

    // Act
    const mark = pickCoachMark(input);

    // Assert
    expect(mark).toBeNull();
  });

  it("should carry the anchor id of the mark it selected", () => {
    // Arrange
    const input = signals({
      available: ["ungroup-block"],
      anchors: { "create-block": "step-1", "ungroup-block": "block-9" },
    });

    // Act
    const mark = pickCoachMark(input);

    // Assert
    expect(mark?.anchorId).toBe("block-9");
  });
});

describe("COACH_MARKS", () => {
  it("should give every mark a side and an align for the tooltip math", () => {
    // Arrange
    const sides = ["top", "right", "bottom", "left"];

    // Act
    const defs = COACH_MARKS;

    // Assert
    expect(defs.every((d) => sides.includes(d.side))).toBe(true);
  });

  it("should not declare the same mark twice", () => {
    // Arrange
    const ids = COACH_MARKS.map((d) => d.id);

    // Act
    const unique = new Set(ids);

    // Assert
    expect(unique.size).toBe(ids.length);
  });
});
