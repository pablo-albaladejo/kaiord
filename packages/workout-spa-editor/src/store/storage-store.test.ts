import { beforeEach, describe, expect, it, vi } from "vitest";

import { createStorageStore } from "./storage-store";

describe("storage-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should start in the 'checking' status", () => {
    // Arrange
    const probe = vi.fn().mockResolvedValue("complete");

    // Act
    const store = createStorageStore({ probe });

    // Assert
    expect(store.getState().status).toBe("checking");
  });

  it("should transition to 'ok' when the probe resolves 'complete'", async () => {
    // Arrange
    const probe = vi.fn().mockResolvedValue("complete");
    const store = createStorageStore({ probe });

    // Act
    await store.getState().probe();

    // Assert
    expect(store.getState().status).toBe("ok");
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("should transition to 'failed' when the probe resolves 'failed'", async () => {
    // Arrange
    const probe = vi.fn().mockResolvedValue("failed");
    const store = createStorageStore({ probe });

    // Act
    await store.getState().probe();

    // Assert
    expect(store.getState().status).toBe("failed");
  });

  it("should transition to 'failed' when the probe throws", async () => {
    // Arrange
    const probe = vi.fn().mockRejectedValue(new Error("boom"));
    const store = createStorageStore({ probe });

    // Act
    await store.getState().probe();

    // Assert
    expect(store.getState().status).toBe("failed");
  });

  it("should be idempotent — second call does not re-probe", async () => {
    // Arrange
    const probe = vi.fn().mockResolvedValue("complete");
    const store = createStorageStore({ probe });
    await store.getState().probe();

    // Act
    await store.getState().probe();

    // Assert
    expect(probe).toHaveBeenCalledTimes(1);
    expect(store.getState().status).toBe("ok");
  });

  it("should share the same in-flight probe across concurrent calls", async () => {
    // Arrange
    const probe = vi.fn().mockResolvedValue("complete");
    const store = createStorageStore({ probe });

    // Act
    await Promise.all([store.getState().probe(), store.getState().probe()]);

    // Assert
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("should expose a stable status shape for subscribers", async () => {
    // Arrange
    const probe = vi.fn().mockResolvedValue("failed");
    const store = createStorageStore({ probe });
    const observed: string[] = [];
    store.subscribe((state) => observed.push(state.status));

    // Act
    await store.getState().probe();

    // Assert
    expect(observed[observed.length - 1]).toBe("failed");
  });
});
