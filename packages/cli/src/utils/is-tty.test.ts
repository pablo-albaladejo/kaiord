import { describe, expect, it, vi } from "vitest";
import { isTTY } from "./is-tty";

describe("isTTY", () => {
  it("should return true when stdout is a TTY", () => {
    // Arrange
    vi.stubGlobal("process", {
      ...process,
      stdout: { isTTY: true },
    });

    // Act
    const result = isTTY();

    // Assert
    expect(result).toBe(true);

    // Cleanup
    vi.unstubAllGlobals();
  });

  it("should return false when stdout is not a TTY", () => {
    // Arrange
    vi.stubGlobal("process", {
      ...process,
      stdout: { isTTY: false },
    });

    // Act
    const result = isTTY();

    // Assert
    expect(result).toBe(false);

    // Cleanup
    vi.unstubAllGlobals();
  });

  it("should return false when isTTY is undefined", () => {
    // Arrange
    vi.stubGlobal("process", {
      ...process,
      stdout: {},
    });

    // Act
    const result = isTTY();

    // Assert
    expect(result).toBe(false);

    // Cleanup
    vi.unstubAllGlobals();
  });
});
