import { describe, expect, it, vi } from "vitest";

import { createWebLocksRecordLock } from "./web-locks-record-lock";

const managerGranting = (lock: Lock | null) =>
  ({
    request: vi.fn(
      (_name: string, _opts: LockOptions, cb: (l: Lock | null) => unknown) =>
        Promise.resolve(cb(lock))
    ),
    query: vi.fn(),
  }) as unknown as LockManager;

describe("createWebLocksRecordLock", () => {
  it("should be undefined without a lock manager", () => {
    // Arrange
    const locks = undefined;

    // Act
    const port = createWebLocksRecordLock(locks);

    // Assert
    expect(port).toBeUndefined();
  });

  it("should run under an ifAvailable lock named by the caller", async () => {
    // Arrange
    const manager = managerGranting({ name: "n", mode: "exclusive" });
    const port = createWebLocksRecordLock(manager);

    // Act
    const outcome = await port?.tryRun("garmin-place:r1", async () => "ran");

    // Assert
    expect(outcome).toEqual({ acquired: true, value: "ran" });
    expect(manager.request).toHaveBeenCalledWith(
      "garmin-place:r1",
      { ifAvailable: true },
      expect.any(Function)
    );
  });

  it("should not run when another tab holds the lock", async () => {
    // Arrange
    const port = createWebLocksRecordLock(managerGranting(null));
    const run = vi.fn(async () => "ran");

    // Act
    const outcome = await port?.tryRun("garmin-place:r1", run);

    // Assert
    expect(outcome).toEqual({ acquired: false });
    expect(run).not.toHaveBeenCalled();
  });
});
