import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUseStorageProbe = vi.fn();
const mockUseBridgeDiscoveryBootstrap = vi.fn();
const mockUseGarminDetection = vi.fn();
const mockUseTrain2GoDetection = vi.fn();

vi.mock("./use-storage-probe", () => ({
  useStorageProbe: () => mockUseStorageProbe(),
}));

vi.mock("./use-bridge-discovery-bootstrap", () => ({
  useBridgeDiscoveryBootstrap: () => mockUseBridgeDiscoveryBootstrap(),
}));

vi.mock("./use-garmin-detection", () => ({
  useGarminDetection: () => mockUseGarminDetection(),
}));

vi.mock("./use-train2go-detection", () => ({
  useTrain2GoDetection: () => mockUseTrain2GoDetection(),
}));

import { useStoreHydration } from "./use-store-hydration";

describe("useStoreHydration", () => {
  it("should delegate to every persisted-state runtime detector", () => {
    // Arrange

    // Act
    renderHook(() => useStoreHydration());

    // Assert
    expect(mockUseStorageProbe).toHaveBeenCalledTimes(1);
    expect(mockUseBridgeDiscoveryBootstrap).toHaveBeenCalledTimes(1);
    expect(mockUseGarminDetection).toHaveBeenCalledTimes(1);
    expect(mockUseTrain2GoDetection).toHaveBeenCalledTimes(1);
  });
});
