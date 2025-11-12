import { describe, expect, it } from "vitest";
import type { Logger } from "./logger";

describe("Logger", () => {
  it("should define logger interface", () => {
    // Arrange
    const mockLogger: Logger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    // Act & Assert
    expect(mockLogger).toBeDefined();
    expect(mockLogger.debug).toBeDefined();
    expect(mockLogger.info).toBeDefined();
    expect(mockLogger.warn).toBeDefined();
    expect(mockLogger.error).toBeDefined();
  });
});
