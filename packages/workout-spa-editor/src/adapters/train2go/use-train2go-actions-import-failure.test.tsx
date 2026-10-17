import type { Analytics } from "@kaiord/core";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { useSyncCallback } from "./use-train2go-actions";

vi.mock("../../application/coaching/sync-week", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

const transport = { source: "train2go" } as CoachingTransport;

describe("useSyncCallback with a failed import", () => {
  it("should close the invoked event with a failure event", async () => {
    // Arrange
    const event = vi.fn();
    const analytics = { event } as unknown as Analytics;
    const persistence = createInMemoryPersistence();
    const { result } = renderHook(() =>
      useSyncCallback(persistence, transport, analytics)
    );

    // Act
    const syncing = result.current("p1", "2026-10-12");

    // Assert
    await expect(syncing).rejects.toThrow();
    expect(event).toHaveBeenLastCalledWith("coaching.sync.failure", {
      source: "train2go",
      errorKind: "transport-error",
      isAutoSync: false,
    });
  });
});
