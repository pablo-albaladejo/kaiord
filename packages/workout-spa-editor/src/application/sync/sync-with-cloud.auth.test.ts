import { describe, expect, it, vi } from "vitest";

import { createInMemorySnapshotPort } from "../../test-utils/in-memory-snapshot-port";
import { CloudAuthRequiredError } from "../../types/cloud-auth-required-error";
import { syncWithCloud } from "./sync-with-cloud";

describe("syncWithCloud without a sign-in", () => {
  it("should throw CloudAuthRequiredError after one attempt instead of retrying", async () => {
    // Arrange
    const pull = vi.fn(async () => {
      throw new CloudAuthRequiredError();
    });
    const cloud = {
      isAuthenticated: () => false,
      authenticate: vi.fn(async () => {}),
      pull,
      push: vi.fn(async () => "rev"),
    };
    const snapshotPort = createInMemorySnapshotPort({
      schemaVersion: 19,
      tables: {},
      tombstones: [],
    });

    // Act
    const run = syncWithCloud({ cloud, snapshotPort, deviceId: "dev-1" });

    // Assert
    await expect(run).rejects.toBeInstanceOf(CloudAuthRequiredError);
    expect(pull).toHaveBeenCalledTimes(1);
  });
});
