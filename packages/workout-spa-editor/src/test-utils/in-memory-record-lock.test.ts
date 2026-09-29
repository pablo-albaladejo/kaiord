import { describe, expect, it } from "vitest";

import { createInMemoryLockManager } from "./in-memory-record-lock";

describe("createInMemoryLockManager", () => {
  it("should refuse a second port while the first holds the name", async () => {
    // Arrange
    const manager = createInMemoryLockManager();
    const [tabA, tabB] = [manager.port(), manager.port()];
    let inner: unknown;

    // Act
    const outer = await tabA.tryRun("n", async () => {
      inner = await tabB.tryRun("n", async () => "b");
      return "a";
    });

    // Assert
    expect(outer).toEqual({ acquired: true, value: "a" });
    expect(inner).toEqual({ acquired: false });
  });

  it("should release the name when run throws", async () => {
    // Arrange
    const manager = createInMemoryLockManager();
    const tab = manager.port();

    // Act
    const failing = tab.tryRun("n", async () => {
      throw new Error("boom");
    });

    // Assert
    await expect(failing).rejects.toThrow("boom");
    expect(manager.held.size).toBe(0);
  });
});
