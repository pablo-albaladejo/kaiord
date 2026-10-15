import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { renderWithProviders } from "../../../test-utils";
import type { AiModelBinding } from "../../../types/ai-model-binding";
import { ModelsSection } from "./ModelsSection";

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

const claude: LlmProviderConfig = {
  id: "claude",
  type: "anthropic",
  apiKey: "sk-ant-1111",
  label: "Mi Claude",
  isDefault: false,
  createdAt: 1,
};
const gpt: LlmProviderConfig = {
  id: "gpt",
  type: "openai",
  apiKey: "sk-gpt-2222",
  label: "Mi GPT",
  isDefault: true,
  createdAt: 2,
};

const shown = (select: HTMLElement): string =>
  (select as HTMLSelectElement).selectedOptions[0]?.textContent ?? "";

describe("ModelsSection", () => {
  beforeEach(() => {
    live.providers = [claude, gpt];
    live.bindings = [];
  });

  it("should show the model that runs when the athlete chose none", () => {
    // Arrange

    // Act
    renderWithProviders(<ModelsSection />);

    // Assert
    const principal = screen.getAllByRole("combobox")[0]!;
    expect(shown(principal)).toContain("gpt-5-mini");
    expect(shown(principal)).toContain("Mi GPT");
  });

  it("should say a purpose without its own model follows the main one, naming it", () => {
    // Arrange
    live.bindings = [
      {
        profileId: "p-1",
        purpose: "default",
        providerId: "claude",
        modelId: "claude-opus-5",
        updatedAt: "2026-10-15T00:00:00.000Z",
      },
    ];

    // Act
    renderWithProviders(<ModelsSection />);

    // Assert
    const chat = screen.getAllByRole("combobox")[1]!;
    expect(shown(chat)).toMatch(/same as main model/i);
    expect(shown(chat)).toContain("claude-opus-5");
    expect(shown(chat)).toContain("Mi Claude");
  });

  it("should show a stored blank model as the model that actually runs", () => {
    // Arrange
    live.bindings = [
      {
        profileId: "p-1",
        purpose: "chat",
        providerId: "gpt",
        modelId: "",
        updatedAt: "2026-10-15T00:00:00.000Z",
      },
    ];

    // Act
    renderWithProviders(<ModelsSection />);

    // Assert
    const chat = screen.getAllByRole("combobox")[1]!;
    expect(shown(chat)).toContain("gpt-5-mini");
  });
});
