import { describe, expect, it } from "vitest";

import { armUnsavedEdits, hasUnsavedEdits } from "./unsaved-edits";

describe("unsaved-edits", () => {
  it("should hold the flag while any arming is active, and clear it on the last disarm", () => {
    // Arrange
    const disarmEditor = armUnsavedEdits();
    const disarmOther = armUnsavedEdits();

    // Act
    disarmEditor();
    const whileOneArmed = hasUnsavedEdits();
    disarmOther();

    // Assert
    expect(whileOneArmed).toBe(true);
    expect(hasUnsavedEdits()).toBe(false);
  });

  it("should ignore a second disarm of the same arming", () => {
    // Arrange
    const disarm = armUnsavedEdits();
    const disarmOther = armUnsavedEdits();

    // Act
    disarm();
    disarm();

    // Assert
    expect(hasUnsavedEdits()).toBe(true);
    disarmOther();
  });
});
