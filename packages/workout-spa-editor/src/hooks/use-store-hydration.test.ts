import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseAiHydration = vi.fn();
const mockUseGarminDetection = vi.fn();

vi.mock("./use-ai-hydration", () => ({
  useAiHydration: () => mockUseAiHydration(),
}));

vi.mock("./use-garmin-detection", () => ({
  useGarminDetection: () => mockUseGarminDetection(),
}));

import { useStoreHydration } from "./use-store-hydration";

describe("useStoreHydration", () => {
  it("should delegate to useAiHydration and useGarminDetection", () => {
    renderHook(() => useStoreHydration());

    expect(mockUseAiHydration).toHaveBeenCalledTimes(1);
    expect(mockUseGarminDetection).toHaveBeenCalledTimes(1);
  });
});
