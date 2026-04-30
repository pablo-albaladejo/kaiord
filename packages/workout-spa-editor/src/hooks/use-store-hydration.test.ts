import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUseGarminDetection = vi.fn();

vi.mock("./use-garmin-detection", () => ({
  useGarminDetection: () => mockUseGarminDetection(),
}));

import { useStoreHydration } from "./use-store-hydration";

describe("useStoreHydration", () => {
  it("delegates to the persisted-state runtime detectors", () => {
    renderHook(() => useStoreHydration());

    expect(mockUseGarminDetection).toHaveBeenCalledTimes(1);
  });
});
