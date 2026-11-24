import type { Analytics } from "@kaiord/core";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { useConnectCallback, useSyncCallback } from "./use-train2go-actions";

vi.mock("../../application/coaching/sync-week", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

vi.mock("../../application/coaching/attempt-link", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

const transport = { source: "train2go" } as CoachingTransport;

describe("useSyncCallback with a failed import", () => {
  it("should close the invoked event with an app-part-not-loaded failure", async () => {
    // Arrange
    const event = vi.fn();
    const analytics = { event } as unknown as Analytics;
    const persistence = createInMemoryPersistence();
    const { result } = renderHook(() =>
      useSyncCallback(persistence, transport, analytics, undefined, vi.fn())
    );

    // Act
    await result.current("p1", "2026-10-12");

    // Assert
    expect(event).toHaveBeenLastCalledWith("coaching.sync.failure", {
      source: "train2go",
      errorKind: "app-part-not-loaded",
      isAutoSync: false,
    });
  });

  it("should tell the athlete part of the App did not load", async () => {
    // Arrange
    const analytics = { event: vi.fn() } as unknown as Analytics;
    const onNotLoaded = vi.fn();
    const persistence = createInMemoryPersistence();
    const { result } = renderHook(() =>
      useSyncCallback(persistence, transport, analytics, undefined, onNotLoaded)
    );

    // Act
    await result.current("p1", "2026-10-12");

    // Assert
    expect(onNotLoaded).toHaveBeenCalledTimes(1);
  });
});

describe("useConnectCallback with a failed import", () => {
  it("should tell the athlete part of the App did not load", async () => {
    // Arrange
    const analytics = { event: vi.fn() } as unknown as Analytics;
    const onNotLoaded = vi.fn();
    const persistence = createInMemoryPersistence();
    const { result } = renderHook(() =>
      useConnectCallback(
        persistence,
        transport,
        analytics,
        undefined,
        onNotLoaded
      )
    );

    // Act
    await result.current("p1");

    // Assert
    expect(onNotLoaded).toHaveBeenCalledTimes(1);
  });
});
