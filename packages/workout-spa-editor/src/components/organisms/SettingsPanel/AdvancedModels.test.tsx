import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { renderWithProviders } from "../../../test-utils";
import type { AiModelBinding } from "../../../types/ai-model-binding";
import { AdvancedModels } from "./AdvancedModels";

const live = vi.hoisted(() => ({
  athlete: { id: "p-1", name: "Ana" },
  providers: [] as LlmProviderConfig[],
  bindings: [] as AiModelBinding[],
}));

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: live.athlete.id,
    profile: { name: live.athlete.name, linkedAccounts: [] },
  }),
}));
vi.mock("../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => live.providers,
}));
vi.mock("../../../hooks/use-ai-model-bindings-live", () => ({
  useAiModelBindingsLive: (profileId: string | null) =>
    live.bindings.filter((b) => b.profileId === profileId),
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

describe("AdvancedModels", () => {
  beforeEach(() => {
    live.athlete = { id: "p-1", name: "Ana" };
    live.providers = [claude, gpt];
    live.bindings = [];
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
    renderWithProviders(<AdvancedModels />);

    // Assert
    const chat = screen.getByLabelText("Chat");
    expect(shown(chat)).toMatch(/same as main model/i);
    expect(shown(chat)).toContain("Claude Opus 5");
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
    renderWithProviders(<AdvancedModels />);

    // Assert
    const chat = screen.getByLabelText("Chat");
    expect(shown(chat)).toContain("GPT-5 mini");
  });

  it("should start collapsed while every task follows the main model", () => {
    // Arrange

    // Act
    renderWithProviders(<AdvancedModels />);

    // Assert
    expect(screen.getByTestId("advanced-models")).not.toHaveAttribute("open");
    expect(
      screen.getByText("Advanced: model per task (for Ana)")
    ).toBeInTheDocument();
  });

  it("should open by itself when a task has its own model", () => {
    // Arrange
    live.bindings = [
      {
        profileId: "p-1",
        purpose: "lab_extraction",
        providerId: "gpt",
        modelId: "gpt-5",
        updatedAt: "2026-10-15T00:00:00.000Z",
      },
    ];

    // Act
    renderWithProviders(<AdvancedModels />);

    // Assert
    expect(screen.getByTestId("advanced-models")).toHaveAttribute("open");
  });

  it("should offer one select per task and none for the main model", () => {
    // Arrange

    // Act
    renderWithProviders(<AdvancedModels />);

    // Assert
    expect(
      screen.getAllByRole("combobox", { hidden: true }).map((c) => c.id)
    ).toEqual([
      "model-chat",
      "model-workout_generation",
      "model-lab_extraction",
    ]);
  });

  it("should leave the athlete out of the title when the athlete has no name", () => {
    // Arrange
    live.athlete = { id: "p-1", name: "" };

    // Act
    renderWithProviders(<AdvancedModels />);

    // Assert
    expect(screen.getByText("Advanced: model per task")).toBeInTheDocument();
  });
});
