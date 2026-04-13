import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockDetectExtension = vi.fn();

vi.mock("../contexts", () => ({
  useGarminBridge: vi.fn(() => ({
    detectExtension: mockDetectExtension,
  })),
}));

import { useGarminDetection } from "./use-garmin-detection";

describe("useGarminDetection", () => {
  it("should call detectExtension on garmin bridge context", () => {
    renderHook(() => useGarminDetection());

    expect(mockDetectExtension).toHaveBeenCalledTimes(1);
  });
});
