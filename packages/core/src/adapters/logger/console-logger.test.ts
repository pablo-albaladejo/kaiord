import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createConsoleLogger } from "./console-logger";

describe("createConsoleLogger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([["debug"], ["info"], ["warn"], ["error"]] as const)(
    "should forward %s calls to the matching console method with message and context",
    (method) => {
      // Arrange
      const logger = createConsoleLogger();
      const message = `${method} message`;
      const context = { key: "value" };

      // Act
      logger[method](message, context);

      // Assert
      expect(console[method]).toHaveBeenCalledWith(message, context);
    }
  );
});
