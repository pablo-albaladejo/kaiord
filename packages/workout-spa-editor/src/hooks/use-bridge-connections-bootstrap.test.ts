import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bridgeConnections } from "../adapters/bridge/bridge-connection-store";
import { useBridgeConnectionsBootstrap } from "./use-bridge-connections-bootstrap";

vi.mock("../adapters/bridge/bridge-connection-store", () => ({
  bridgeConnections: { start: vi.fn(), stop: vi.fn() },
}));

const HERE = dirname(fileURLToPath(import.meta.url));

describe("useBridgeConnectionsBootstrap", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should start the connection store on mount", () => {
    // Arrange
    const start = vi.mocked(bridgeConnections.start);
    const before = start.mock.calls.length;

    // Act
    renderHook(() => useBridgeConnectionsBootstrap());

    // Assert
    expect(start.mock.calls.length).toBe(before + 1);
  });

  it("should stop the connection store on unmount", () => {
    // Arrange
    const stop = vi.mocked(bridgeConnections.stop);
    const { unmount } = renderHook(() => useBridgeConnectionsBootstrap());
    const before = stop.mock.calls.length;

    // Act
    unmount();

    // Assert
    expect(stop.mock.calls.length).toBe(before + 1);
  });
});

describe("bridge connections bootstrap wiring", () => {
  it("should be mounted by store hydration", () => {
    // Arrange
    const source = readFileSync(join(HERE, "use-store-hydration.ts"), "utf8");

    // Act
    const mounted = /useBridgeConnectionsBootstrap\(\)/.test(source);

    // Assert
    // The Connections page renders `useBridgeConnections`, so the store has a
    // consumer and must be polling. An app-scoped mount keeps the cadence and
    // the positive cache across navigations.
    expect(mounted).toBe(true);
  });
});
