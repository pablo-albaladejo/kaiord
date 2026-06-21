import { describe, expect, it } from "vitest";

import { durationMarkSize } from "./mark-size";

const SHORT_SEC = 1200; // 20 min
const MEDIUM_SEC = 2700; // 45 min
const LONG_SEC = 5400; // 90 min

describe("durationMarkSize", () => {
  it("should default to medium when the duration is unknown", () => {
    // Arrange

    // Act
    const size = durationMarkSize(null);

    // Assert
    expect(size).toBe("md");
  });

  it("should size a short session small", () => {
    // Arrange

    // Act
    const size = durationMarkSize(SHORT_SEC);

    // Assert
    expect(size).toBe("sm");
  });

  it("should size a typical session medium", () => {
    // Arrange

    // Act
    const size = durationMarkSize(MEDIUM_SEC);

    // Assert
    expect(size).toBe("md");
  });

  it("should size a long session large", () => {
    // Arrange

    // Act
    const size = durationMarkSize(LONG_SEC);

    // Assert
    expect(size).toBe("lg");
  });
});
