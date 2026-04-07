import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockHydrateAi = vi.fn();
const mockDetectExtension = vi.fn();

vi.mock("../store/ai-store", () => ({
  useAiStore: vi.fn((selector: (s: { hydrate: () => void }) => unknown) =>
    selector({ hydrate: mockHydrateAi })
  ),
}));

vi.mock("../store/garmin-store", () => ({
  useGarminStore: vi.fn(
    (selector: (s: { detectExtension: () => void }) => unknown) =>
      selector({ detectExtension: mockDetectExtension })
  ),
}));

import { useStoreHydration } from "./use-store-hydration";

describe("useStoreHydration", () => {
  it("should call hydrate on ai store and detectExtension on garmin store", () => {
    renderHook(() => useStoreHydration());

    expect(mockHydrateAi).toHaveBeenCalledTimes(1);
    expect(mockDetectExtension).toHaveBeenCalledTimes(1);
  });
});
