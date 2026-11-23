import { describe, expect, it } from "vitest";

import { flushPendingSaves, registerPendingFlush } from "./pending-flushes";

describe("pending-flushes", () => {
  it("should await every registered flush", async () => {
    // Arrange
    const order: string[] = [];
    let finish: () => void = () => undefined;
    const unregister = registerPendingFlush(
      () =>
        new Promise<void>((resolve) => {
          finish = () => {
            order.push("saved");
            resolve();
          };
        })
    );

    // Act
    const flushed = flushPendingSaves().then(() => order.push("flushed"));
    finish();
    await flushed;

    // Assert
    expect(order).toEqual(["saved", "flushed"]);
    unregister();
  });

  it("should not call a flush that was unregistered", async () => {
    // Arrange
    let calls = 0;
    const unregister = registerPendingFlush(() => {
      calls += 1;
    });
    unregister();

    // Act
    await flushPendingSaves();

    // Assert
    expect(calls).toBe(0);
  });

  it("should settle even when a flush fails", async () => {
    // Arrange
    const unregister = registerPendingFlush(() =>
      Promise.reject(new Error("disk full"))
    );

    // Act
    const result = flushPendingSaves();

    // Assert
    await expect(result).resolves.toBeUndefined();
    unregister();
  });
});
