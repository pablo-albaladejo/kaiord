import { describe, expect, it, vi } from "vitest";

import { type LiveState, readLiveState } from "./live-state";

const SETTLE_MS = 3_000;

const reads = (...states: LiveState[]) => {
  const queue = [...states];
  return vi.fn(async () => ({ state: queue.shift() ?? "unknown" }));
};

describe("readLiveState", () => {
  it("should count an absence only when a second read after the settle agrees", async () => {
    // Arrange
    const read = reads("absent", "present");
    const sleep = vi.fn(async () => {});

    // Act
    const result = await readLiveState(read, { ms: SETTLE_MS, sleep });

    // Assert
    expect(result.state).toBe("present");
    expect(sleep).toHaveBeenCalledWith(SETTLE_MS);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("should read once when the first read shows the entry or cannot tell", async () => {
    // Arrange
    const present = reads("present");
    const unknown = reads("unknown");
    const sleep = vi.fn(async () => {});

    // Act
    const a = await readLiveState(present, { ms: SETTLE_MS, sleep });
    const b = await readLiveState(unknown, { ms: SETTLE_MS, sleep });

    // Assert
    expect([a.state, b.state]).toEqual(["present", "unknown"]);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("should take the Platform's own not-found as confirmed without a settle", async () => {
    // Arrange
    const read = reads("absent", "present");

    // Act
    const result = await readLiveState(read);

    // Assert
    expect(result.state).toBe("absent");
    expect(read).toHaveBeenCalledTimes(1);
  });
});
