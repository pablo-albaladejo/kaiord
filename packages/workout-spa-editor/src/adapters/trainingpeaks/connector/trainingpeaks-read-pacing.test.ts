import { describe, expect, it, vi } from "vitest";

import { createReadPacing } from "./trainingpeaks-read-pacing";

const INTERVAL_MS = 150;
const SOON_AFTER_MS = 40;

describe("createReadPacing", () => {
  it("should let the first read go at once", async () => {
    // Arrange
    const sleep = vi.fn(async () => {});
    const space = createReadPacing({ now: () => 0, sleep });

    // Act
    await space();

    // Assert
    expect(sleep).not.toHaveBeenCalled();
  });

  it("should delay a read that follows another by what is left of the interval", async () => {
    // Arrange
    const at = { now: 1_000 };
    const sleep = vi.fn(async () => {});
    const space = createReadPacing({ now: () => at.now, sleep });
    await space();
    at.now += SOON_AFTER_MS;

    // Act
    await space();

    // Assert
    expect(sleep).toHaveBeenCalledWith(INTERVAL_MS - SOON_AFTER_MS);
  });

  it("should not delay a read that comes after the interval", async () => {
    // Arrange
    const at = { now: 1_000 };
    const sleep = vi.fn(async () => {});
    const space = createReadPacing({ now: () => at.now, sleep });
    await space();
    at.now += INTERVAL_MS;

    // Act
    await space();

    // Assert
    expect(sleep).not.toHaveBeenCalled();
  });
});
