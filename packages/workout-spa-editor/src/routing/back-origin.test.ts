import { describe, expect, it } from "vitest";

import { BACK_ORIGINS, parseBackOrigin } from "./back-origin";

describe("parseBackOrigin", () => {
  it("should accept every origin in the closed vocabulary", () => {
    // Arrange
    const inputs = [...BACK_ORIGINS];

    // Act
    const results = inputs.map((origin) => parseBackOrigin(origin));

    // Assert
    expect(results).toEqual(inputs);
  });

  it("should normalize the legacy today origin to daily", () => {
    // Arrange
    const raw = "today";

    // Act
    const result = parseBackOrigin(raw);

    // Assert
    expect(result).toBe("daily");
  });

  it("should return null for an unknown origin value", () => {
    // Arrange
    const raw = "settings";

    // Act
    const result = parseBackOrigin(raw);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null for a null input", () => {
    // Arrange
    const raw = null;

    // Act
    const result = parseBackOrigin(raw);

    // Assert
    expect(result).toBeNull();
  });
});
