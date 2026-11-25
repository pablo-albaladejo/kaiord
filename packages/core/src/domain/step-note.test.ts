import { describe, expect, it } from "vitest";

import type { WorkoutStep } from "./schemas/workout";
import { clearNoteOrigin, isAiNote, markAiNote } from "./step-note";

const step = (extra: Partial<WorkoutStep> = {}): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 30 },
  targetType: "open",
  target: { type: "open" },
  notes: "Spin easy",
  ...extra,
});

describe("step note origin", () => {
  it("should read a note marked as the AI's own as an AI note", () => {
    // Arrange
    const marked = markAiNote(step());

    // Act
    const result = isAiNote(marked);

    // Assert
    expect(result).toBe(true);
  });

  it("should read an unmarked note as the coach's", () => {
    // Arrange
    const unmarked = step();

    // Act
    const result = isAiNote(unmarked);

    // Assert
    expect(result).toBe(false);
  });

  it("should keep a step's other extensions when marking and clearing", () => {
    // Arrange
    const withZwift = step({ extensions: { zwift: { cadence: 90 } } });

    // Act
    const cleared = clearNoteOrigin(markAiNote(withZwift));

    // Assert
    expect(cleared).toEqual(withZwift);
  });

  it("should drop the extensions once the origin was the only one", () => {
    // Arrange
    const marked = markAiNote(step());

    // Act
    const cleared = clearNoteOrigin(marked);

    // Assert
    expect(cleared).not.toHaveProperty("extensions");
    expect(isAiNote(cleared)).toBe(false);
  });
});
