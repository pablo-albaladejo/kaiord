import { describe, expect, it, vi } from "vitest";
import { createStderrLogger } from "./stderr-logger";

describe("createStderrLogger", () => {
  it("should create a logger with all four methods", () => {
    const logger = createStderrLogger();

    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it("should write debug messages to stderr", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createStderrLogger();

    logger.debug("test message", { key: "value" });

    expect(spy).toHaveBeenCalledWith("[DEBUG] test message", { key: "value" });
    spy.mockRestore();
  });

  it("should write info messages to stderr", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createStderrLogger();

    logger.info("test message");

    expect(spy).toHaveBeenCalledWith("[INFO] test message", "");
    spy.mockRestore();
  });

  it("should write warn messages to stderr", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createStderrLogger();

    logger.warn("warning", { detail: "info" });

    expect(spy).toHaveBeenCalledWith("[WARN] warning", { detail: "info" });
    spy.mockRestore();
  });

  it("should write error messages to stderr", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createStderrLogger();

    logger.error("error occurred");

    expect(spy).toHaveBeenCalledWith("[ERROR] error occurred", "");
    spy.mockRestore();
  });
});
