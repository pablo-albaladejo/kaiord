import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockHydrateAi = vi.fn();

vi.mock("../store/ai-store", () => ({
  useAiStore: vi.fn((selector: (s: { hydrate: () => void }) => unknown) =>
    selector({ hydrate: mockHydrateAi })
  ),
}));

import { useAiHydration } from "./use-ai-hydration";

describe("useAiHydration", () => {
  it("should call hydrate on ai store", () => {
    renderHook(() => useAiHydration());

    expect(mockHydrateAi).toHaveBeenCalledTimes(1);
  });
});
