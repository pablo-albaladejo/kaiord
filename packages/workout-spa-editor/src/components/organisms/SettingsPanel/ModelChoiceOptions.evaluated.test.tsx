import { EVALUATED_MODELS, listedModels } from "@kaiord/ai/providers";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { modelChoiceGroups } from "./model-choice";
import { ModelChoiceOptions } from "./ModelChoiceOptions";

const account = (type: LlmProviderConfig["type"]): LlmProviderConfig => ({
  id: type,
  type,
  apiKey: "k",
  label: `My ${type}`,
  isDefault: type === "anthropic",
  createdAt: 1,
});

const renderOptions = (providers: LlmProviderConfig[]) =>
  render(
    <select aria-label="Model">
      <ModelChoiceOptions groups={modelChoiceGroups(providers, null)} />
    </select>
  );

describe("ModelChoiceOptions evaluation label", () => {
  it("should label Google's default not evaluated where the athlete chooses it", () => {
    // Arrange
    const google = account("google");

    // Act
    renderOptions([google]);

    // Assert
    expect(
      screen.getByRole("option", {
        name: "Gemini 2.5 Flash (not evaluated) · My google",
      })
    ).toBeInTheDocument();
  });

  it("should label every offered model not evaluated unless the stored eval results passed it", () => {
    // Arrange
    const providers = [
      account("anthropic"),
      account("openai"),
      account("google"),
    ];

    // Act
    renderOptions(providers);

    // Assert
    for (const provider of providers) {
      const group = screen.getByRole("group", {
        name: new RegExp(`^${provider.label} · `),
      });
      for (const modelId of listedModels(provider.type)) {
        const passed = EVALUATED_MODELS[provider.type].includes(modelId);
        const option = within(group)
          .getAllByRole("option")
          .find((o) => (o as HTMLOptionElement).value.endsWith(`::${modelId}`));
        expect(option?.textContent?.includes("(not evaluated)")).toBe(!passed);
      }
    }
    expect(
      screen.getByRole("option", { name: "Claude Sonnet 5 · My anthropic" })
    ).toBeInTheDocument();
  });
});
