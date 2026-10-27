import { describe, expect, it, vi } from "vitest";

import { onSyncedTableChange } from "./sync-change-notifier";

describe("onSyncedTableChange", () => {
  it("should hear a change another tab relays", async () => {
    // Arrange
    const changes = vi.fn();
    const unsubscribe = onSyncedTableChange(changes);
    const otherTab = new BroadcastChannel("kaiord-synced-table-change");

    // Act
    otherTab.postMessage(null);
    await vi.waitFor(() => expect(changes).toHaveBeenCalled());

    // Assert
    expect(changes).toHaveBeenCalledTimes(1);
    unsubscribe();
    otherTab.close();
  });
});
