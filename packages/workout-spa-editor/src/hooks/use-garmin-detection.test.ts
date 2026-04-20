import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockDetectExtension = vi.fn();

vi.mock("../contexts", () => ({
  useGarminBridge: vi.fn(() => ({
    detectExtension: mockDetectExtension,
  })),
}));

vi.mock("./use-discovered-extension-id", () => ({
  useDiscoveredExtensionId: vi.fn(() => null),
}));

import { useGarminDetection } from "./use-garmin-detection";

describe("useGarminDetection", () => {
  it("calls detectExtension on mount even without a discovered id", () => {
    renderHook(() => useGarminDetection());

    expect(mockDetectExtension).toHaveBeenCalledTimes(1);
  });
});
