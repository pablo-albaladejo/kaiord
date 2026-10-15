import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { EffectiveModel } from "./effective-models";
import { encodeChoice, encodeCustom, INHERIT_VALUE } from "./model-choice";
import { ModelChoiceSelect } from "./ModelChoiceSelect";

const claude: LlmProviderConfig = {
  id: "claude",
  type: "anthropic",
  apiKey: "k1",
  label: "Mi Claude",
  isDefault: true,
  createdAt: 1,
};
const gpt: LlmProviderConfig = {
  ...claude,
  id: "gpt",
  type: "openai",
  label: "Mi GPT",
};

const effective = (over: Partial<EffectiveModel> = {}): EffectiveModel => ({
  purpose: "chat",
  running: { providerId: "claude", modelId: "claude-sonnet-5" },
  storedModelId: "claude-sonnet-5",
  inherited: false,
  ...over,
});

const renderSelect = (over: Partial<EffectiveModel> = {}, inherit = false) => {
  const onChoose = vi.fn();
  const onInherit = vi.fn();
  render(
    <ModelChoiceSelect
      id="model-chat"
      label="Chat"
      providers={[claude, gpt]}
      effective={effective(over)}
      principal={
        inherit ? { providerId: "gpt", modelId: "gpt-5-mini" } : undefined
      }
      onChoose={onChoose}
      onInherit={inherit ? onInherit : undefined}
    />
  );
  return { onChoose, onInherit, select: screen.getByLabelText("Chat") };
};

describe("ModelChoiceSelect", () => {
  it("should choose a provider and its model together", async () => {
    // Arrange
    const { onChoose, select } = renderSelect();

    // Act
    await userEvent.selectOptions(
      select,
      encodeChoice({ providerId: "gpt", modelId: "gpt-5-mini" })
    );

    // Assert
    expect(onChoose).toHaveBeenCalledWith({
      providerId: "gpt",
      modelId: "gpt-5-mini",
    });
  });

  it("should commit a typed custom model id for the chosen account", async () => {
    // Arrange
    const { onChoose, select } = renderSelect();

    // Act
    await userEvent.selectOptions(select, encodeCustom("gpt"));
    await userEvent.type(
      screen.getByTestId("model-choice-custom"),
      "gpt-x{Enter}"
    );

    // Assert
    expect(onChoose).toHaveBeenCalledWith({
      providerId: "gpt",
      modelId: "gpt-x",
    });
  });

  it("should never commit a blank custom model id", async () => {
    // Arrange
    const { onChoose, select } = renderSelect();

    // Act
    await userEvent.selectOptions(select, encodeCustom("gpt"));
    await userEvent.type(
      screen.getByTestId("model-choice-custom"),
      "   {Enter}"
    );

    // Assert
    expect(onChoose).not.toHaveBeenCalled();
    expect(screen.queryByTestId("model-choice-custom")).not.toBeInTheDocument();
  });

  it("should show a running model outside the catalog as selected", () => {
    // Arrange
    const running = { providerId: "claude", modelId: "my-custom-model" };

    // Act
    const { select } = renderSelect({
      running,
      storedModelId: running.modelId,
    });

    // Assert
    expect(select).toHaveValue(encodeChoice(running));
  });

  it("should select and offer following the main model when the purpose has none", async () => {
    // Arrange
    const { onInherit, select } = renderSelect(
      { storedModelId: null, inherited: true },
      true
    );

    // Act
    const shown = (select as HTMLSelectElement).selectedOptions[0]?.textContent;
    await userEvent.selectOptions(
      select,
      encodeChoice({ providerId: "claude", modelId: "claude-opus-5" })
    );
    await userEvent.selectOptions(select, INHERIT_VALUE);

    // Assert
    expect(shown).toBe("Same as main model (GPT-5 mini · Mi GPT)");
    expect(onInherit).toHaveBeenCalledTimes(1);
  });

  it("should name the successor used in place of a retired stored model", () => {
    // Arrange
    const retired = "claude-3-haiku-20240307";

    // Act
    renderSelect({
      running: { providerId: "claude", modelId: "claude-haiku-4-5" },
      storedModelId: retired,
    });

    // Assert
    expect(screen.getByTestId("model-chat-retired")).toHaveTextContent(
      "claude-3-haiku-20240307 was retired by the provider — using claude-haiku-4-5 instead."
    );
  });

  it("should not offer a retired model as an option", () => {
    // Arrange
    const retired = "claude-3-haiku-20240307";

    // Act
    renderSelect();

    // Assert
    expect(
      screen.queryByRole("option", { name: new RegExp(retired) })
    ).not.toBeInTheDocument();
  });

  it("should name each model by its product name, once", () => {
    // Arrange

    // Act
    renderSelect();

    // Assert
    expect(
      screen.getByRole("option", { name: "Claude Sonnet 5 · Mi Claude" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("option", { name: /^Claude Haiku 4\.5/ })
    ).toHaveLength(1);
    expect(
      screen.queryByRole("option", { name: /claude-haiku-4-5-20251001/ })
    ).not.toBeInTheDocument();
  });

  it("should still show a running dated pin, by name and date", () => {
    // Arrange
    const running = {
      providerId: "claude",
      modelId: "claude-haiku-4-5-20251001",
    };

    // Act
    const { select } = renderSelect({
      running,
      storedModelId: running.modelId,
    });

    // Assert
    expect((select as HTMLSelectElement).selectedOptions[0]?.textContent).toBe(
      "Claude Haiku 4.5 (2025-10-01) · Mi Claude"
    );
  });
});
