import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { ChatModelPicker } from "./ChatModelPicker";

const provider = (id: string, label: string): LlmProviderConfig => ({
  id,
  type: "anthropic",
  apiKey: "sk",
  label,
  isDefault: id === "a",
  createdAt: 1,
});

describe("ChatModelPicker", () => {
  it("should name the model the selected provider runs, and no empty parentheses", () => {
    // Arrange
    const providers = [provider("a", "Mi Claude"), provider("b", "Otra")];

    // Act
    render(
      <ChatModelPicker
        providers={providers}
        provider={providers[0]!}
        modelId="claude-sonnet-5"
        onModelChange={() => {}}
      />
    );

    // Assert
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Mi Claude (claude-sonnet-5)", "Otra"]);
  });

  it("should show the bare label while the model is unknown", () => {
    // Arrange
    const providers = [provider("a", "Mi Claude")];

    // Act
    render(
      <ChatModelPicker
        providers={providers}
        provider={null}
        modelId={null}
        onModelChange={() => {}}
      />
    );

    // Assert
    expect(screen.getByRole("option").textContent).toBe("Mi Claude");
  });
});
