/**
 * The create-workout model select shows what workout generation actually
 * runs (`resolveModelForPurpose("workout_generation", …)`), and choosing a
 * model stores the athlete's `workout_generation` binding, which is what the
 * generation reads.
 */
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { renderWithProviders } from "../../../test-utils";
import type { AiModelBinding } from "../../../types/ai-model-binding";
import { ModelSelector } from "./ModelSelector";

const live = vi.hoisted(() => ({
  bindings: [] as AiModelBinding[],
  setModelBinding: vi.fn(async () => undefined),
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p-1", profile: null }),
}));
vi.mock("../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => [claude, gpt],
}));
vi.mock("../../../hooks/use-ai-model-bindings-live", () => ({
  useAiModelBindingsLive: () => live.bindings,
}));
vi.mock("../../../application/ai/set-model-binding", () => ({
  setModelBinding: live.setModelBinding,
}));

const claude: LlmProviderConfig = {
  id: "claude",
  type: "anthropic",
  apiKey: "sk-ant-1111",
  label: "Mi Claude",
  isDefault: true,
  createdAt: 1,
};
const gpt: LlmProviderConfig = {
  id: "gpt",
  type: "openai",
  apiKey: "sk-gpt-2222",
  label: "Mi GPT",
  isDefault: false,
  createdAt: 2,
};

const bound = (purpose: string, providerId: string, modelId: string) =>
  ({
    profileId: "p-1",
    purpose,
    providerId,
    modelId,
    updatedAt: "2026-10-15T00:00:00.000Z",
  }) as AiModelBinding;

const shown = (): string =>
  (screen.getByRole("combobox") as HTMLSelectElement).selectedOptions[0]
    ?.textContent ?? "";

describe("ModelSelector", () => {
  beforeEach(() => {
    live.bindings = [];
    live.setModelBinding.mockClear();
  });

  it("should show the athlete's main model when generation has none of its own", () => {
    // Arrange
    live.bindings = [bound("default", "gpt", "gpt-4.1")];

    // Act
    renderWithProviders(<ModelSelector />);

    // Assert
    expect(shown()).toContain("gpt-4.1");
    expect(shown()).toContain("Mi GPT");
  });

  it("should show the workout-generation model when the athlete set one", () => {
    // Arrange
    live.bindings = [
      bound("default", "claude", "claude-opus-5"),
      bound("workout_generation", "gpt", "gpt-5-mini"),
    ];

    // Act
    renderWithProviders(<ModelSelector />);

    // Assert
    expect(shown()).toContain("gpt-5-mini");
    expect(shown()).toContain("Mi GPT");
  });

  it("should store the choice as the athlete's workout-generation model", () => {
    // Arrange
    renderWithProviders(<ModelSelector />);

    // Act
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "gpt::gpt-5-mini" },
    });

    // Assert
    expect(live.setModelBinding).toHaveBeenCalledWith(expect.anything(), {
      profileId: "p-1",
      purpose: "workout_generation",
      providerId: "gpt",
      modelId: "gpt-5-mini",
    });
  });
});
