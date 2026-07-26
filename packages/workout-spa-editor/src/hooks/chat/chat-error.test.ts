import { describe, expect, it } from "vitest";

import { categorizeChatError } from "./chat-error";

describe("categorizeChatError", () => {
  it("should map auth failures to a fixed category", () => {
    // Arrange
    const error = new Error("401 Unauthorized: invalid api_key sk-secret");

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).toBe("auth");
  });

  it("should map rate/quota failures to a fixed category", () => {
    // Arrange
    const error = new Error("429 rate limit exceeded");

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).toBe("rate");
  });

  it("should map network failures to a fixed category", () => {
    // Arrange
    const error = new Error("fetch failed: network timeout");

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).toBe("network");
  });

  it("should fall back to a generic category for unknown errors", () => {
    // Arrange
    const error = "some opaque failure";

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).toBe("generic");
  });

  it("should never leak the original message into the category", () => {
    // Arrange
    const error = new Error("boom: user said I slept 7 hours and weigh 80kg");

    // Act
    const category = categorizeChatError(error);

    // Assert
    expect(category).not.toContain("slept");
    expect(category).not.toContain("80kg");
  });
});
