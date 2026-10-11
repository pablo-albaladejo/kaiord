import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { ModelSelector } from "./ModelSelector";

const providers: LlmProviderConfig[] = [
  {
    id: "ai-1",
    type: "anthropic",
    apiKey: "k",
    label: "Mine",
    model: "claude-sonnet-5",
    isDefault: true,
    createdAt: 1,
  },
  {
    id: "ai-2",
    type: "openai",
    apiKey: "k",
    label: "Work",
    isDefault: false,
    createdAt: 2,
  },
];

vi.mock("../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => providers,
}));

describe("ModelSelector", () => {
  it("should name the model beside the label when the provider has one", () => {
    // Arrange

    // Act
    render(<ModelSelector />);

    // Assert
    expect(
      screen.getByRole("option", { name: "Mine (claude-sonnet-5)" })
    ).toBeInTheDocument();
  });

  it("should show the label alone when the provider has no model", () => {
    // Arrange

    // Act
    render(<ModelSelector />);

    // Assert
    expect(screen.getByRole("option", { name: "Work" })).toBeInTheDocument();
  });
});
