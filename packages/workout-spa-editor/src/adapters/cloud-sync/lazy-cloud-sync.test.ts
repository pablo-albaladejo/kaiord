import { describe, expect, it, vi } from "vitest";

import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import type { Snapshot } from "../../types/snapshot";
import { createLazyCloudSync } from "./lazy-cloud-sync";

function fakePort(authenticated = true): CloudSyncPort {
  return {
    isAuthenticated: () => authenticated,
    authenticate: vi.fn(async () => {}),
    pull: vi.fn(async () => null),
    push: vi.fn(async () => "rev-2"),
  };
}

describe("createLazyCloudSync", () => {
  it("should not load the adapter until sync is used", () => {
    // Arrange
    const load = vi.fn(async () => fakePort());

    // Act
    const port = createLazyCloudSync(load);

    // Assert
    expect(load).not.toHaveBeenCalled();
    expect(port.isAuthenticated()).toBe(false);
  });

  it("should load once and delegate every call to the loaded adapter", async () => {
    // Arrange
    const inner = fakePort();
    const load = vi.fn(async () => inner);
    const port = createLazyCloudSync(load);
    const snapshot = { manifest: {} } as unknown as Snapshot;

    // Act
    await port.authenticate();
    await port.pull();
    const revision = await port.push(snapshot, "rev-1");

    // Assert
    expect(load).toHaveBeenCalledTimes(1);
    expect(inner.authenticate).toHaveBeenCalledTimes(1);
    expect(inner.push).toHaveBeenCalledWith(snapshot, "rev-1");
    expect(revision).toBe("rev-2");
    expect(port.isAuthenticated()).toBe(true);
  });

  it("should load once when called concurrently before the load resolves", async () => {
    // Arrange
    const inner = fakePort();
    let resolveLoad: (port: CloudSyncPort) => void = () => {};
    const load = vi.fn(
      () =>
        new Promise<CloudSyncPort>((resolve) => {
          resolveLoad = resolve;
        })
    );
    const port = createLazyCloudSync(load);

    // Act
    const first = port.pull();
    const second = port.authenticate();
    resolveLoad(inner);
    await Promise.all([first, second]);

    // Assert
    expect(load).toHaveBeenCalledTimes(1);
    expect(inner.pull).toHaveBeenCalledTimes(1);
    expect(inner.authenticate).toHaveBeenCalledTimes(1);
  });

  it("should retry the load after a failed one", async () => {
    // Arrange
    const inner = fakePort();
    const load = vi
      .fn<() => Promise<CloudSyncPort>>()
      .mockRejectedValueOnce(new Error("chunk failed"))
      .mockResolvedValueOnce(inner);
    const port = createLazyCloudSync(load);

    // Act
    const first = port.pull();

    // Assert
    await expect(first).rejects.toThrow("chunk failed");
    await expect(port.pull()).resolves.toBeNull();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
