import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { AiModelBinding } from "../../../types/ai-model-binding";
import { useSettingsRowValues } from "./use-settings-row-values";

const live = vi.hoisted(() => ({
  providers: [] as LlmProviderConfig[],
  bindings: [] as AiModelBinding[],
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p-1", profile: null }),
}));
vi.mock("../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => live.providers,
}));
vi.mock("../../../hooks/use-ai-model-bindings-live", () => ({
  useAiModelBindingsLive: () => live.bindings,
}));
vi.mock("./use-sync-value", () => ({ useSyncValue: () => undefined }));

const provider = (id: string, isDefault: boolean): LlmProviderConfig => ({
  id,
  type: "anthropic",
  apiKey: "k",
  label: `Label ${id}`,
  isDefault,
  createdAt: 1,
});

describe("useSettingsRowValues", () => {
  it("should name the athlete's main model by its product name", () => {
    // Arrange
    live.providers = [provider("a", true), provider("b", false)];
    live.bindings = [
      {
        profileId: "p-1",
        purpose: "default",
        providerId: "b",
        modelId: "claude-opus-5",
        updatedAt: "2026-10-15T00:00:00.000Z",
      },
    ];

    // Act
    const { result } = renderHook(() => useSettingsRowValues());

    // Assert
    expect(result.current.ai).toBe("Claude Opus 5");
  });

  it("should show no AI value without a provider", () => {
    // Arrange
    live.providers = [];
    live.bindings = [];

    // Act
    const { result } = renderHook(() => useSettingsRowValues());

    // Assert
    expect(result.current.ai).toBeUndefined();
  });
});
