import { afterEach, describe, expect, it, vi } from "vitest";

import { createWarningLogger } from "./create-warning-logger";

describe("createWarningLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should hand every warning to the callback and still log it", () => {
    // Arrange
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onWarning = vi.fn();
    const logger = createWarningLogger(onWarning);

    // Act
    logger.warn("Unsupported target type", { targetType: "Power_t" });

    // Assert
    expect(onWarning).toHaveBeenCalledWith("Unsupported target type");
    expect(consoleWarn).toHaveBeenCalledWith("Unsupported target type", {
      targetType: "Power_t",
    });
  });

  it("should not report debug, info or error messages as warnings", () => {
    // Arrange
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onWarning = vi.fn();
    const logger = createWarningLogger(onWarning);

    // Act
    logger.debug("d");
    logger.info("i");
    logger.error("e");

    // Assert
    expect(onWarning).not.toHaveBeenCalled();
  });
});
