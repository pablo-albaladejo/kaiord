import { describe, expect, it } from "vitest";

import { useWorkoutStore } from "./workout-store";

describe("deleteRepetitionBlock exists in store", () => {
  it("should have deleteRepetitionBlock method", () => {
    // Arrange

    // Act
    const store = useWorkoutStore.getState();

    // Assert
    expect(store.deleteRepetitionBlock).toBeDefined();
    expect(typeof store.deleteRepetitionBlock).toBe("function");
  });
});
