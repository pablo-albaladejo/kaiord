import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockHydrateAi = vi.fn();
const mockHydrateGarmin = vi.fn();

vi.mock("../store/ai-store", () => ({
  useAiStore: vi.fn((selector: (s: { hydrate: () => void }) => unknown) =>
    selector({ hydrate: mockHydrateAi })
  ),
}));

vi.mock("../store/garmin-store", () => ({
  useGarminStore: vi.fn((selector: (s: { hydrate: () => void }) => unknown) =>
    selector({ hydrate: mockHydrateGarmin })
  ),
}));

import { useStoreHydration } from "./use-store-hydration";

describe("useStoreHydration", () => {
  it("should call hydrate on both ai and garmin stores", () => {
    renderHook(() => useStoreHydration());

    expect(mockHydrateAi).toHaveBeenCalledTimes(1);
    expect(mockHydrateGarmin).toHaveBeenCalledTimes(1);
  });
});
