/**
 * Model bindings are keyed `[profileId+purpose]`, so their tombstone id is
 * the composite key (`<profileId>:<purpose>`). Without it a cleared or
 * removed binding comes back from another device's snapshot.
 */
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { withTombstones } from "./with-tombstones";

const binding = {
  profileId: "p-1",
  purpose: "chat" as const,
  providerId: "prov-1",
  modelId: "m-1",
  updatedAt: "2026-10-15T08:00:00.000Z",
};

describe("withTombstones — model bindings", () => {
  it("should record a composite-key tombstone when a binding is deleted", async () => {
    // Arrange
    const port = withTombstones(createInMemoryPersistence());
    await port.aiModelBindings.put(binding);

    // Act
    await port.aiModelBindings.delete("p-1", "chat");
    const tombstone = await port.tombstones.get("aiModelBindings", "p-1:chat");

    // Assert
    expect(await port.aiModelBindings.get("p-1", "chat")).toBeUndefined();
    expect(tombstone).toMatchObject({
      table: "aiModelBindings",
      id: "p-1:chat",
      profileId: "p-1",
    });
  });

  it("should record no tombstone when no binding was there", async () => {
    // Arrange
    const port = withTombstones(createInMemoryPersistence());

    // Act
    await port.aiModelBindings.delete("p-1", "chat");
    const tombstone = await port.tombstones.get("aiModelBindings", "p-1:chat");

    // Assert
    expect(tombstone).toBeUndefined();
  });
});
