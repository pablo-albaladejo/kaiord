import { describe, expect, it } from "vitest";

import { errorMessage } from "./error-message";

describe("errorMessage", () => {
  it("should return an Error's message", () => {
    // Arrange
    const error = new Error("boom");

    // Act
    const message = errorMessage(error);

    // Assert
    expect(message).toBe("boom");
  });

  it("should stringify a non-Error value", () => {
    // Arrange
    const thrown = { toString: () => "plain" };

    // Act
    const message = errorMessage(thrown);

    // Assert
    expect(message).toBe("plain");
  });
});
