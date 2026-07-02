import { describe, expect, it } from "vitest";

import { adjustWithAiHref } from "./adjust-with-ai-href";

describe("adjustWithAiHref", () => {
  it("should build a chat prefill link carrying the workout id and date", () => {
    // Arrange
    const workout = { id: "w-1", date: "2026-07-03" };

    // Act
    const href = adjustWithAiHref(workout);

    // Assert
    expect(href).toBe(
      `/chat?prefill=${encodeURIComponent(
        "Adjust my workout with id w-1 scheduled on 2026-07-03: "
      )}`
    );
  });

  it("should omit the date clause when the workout has no date", () => {
    // Arrange
    const workout = { id: "w-2", date: null as unknown as string };

    // Act
    const href = adjustWithAiHref(workout);

    // Assert
    expect(decodeURIComponent(href)).toContain(
      "Adjust my workout with id w-2: "
    );
  });
});
