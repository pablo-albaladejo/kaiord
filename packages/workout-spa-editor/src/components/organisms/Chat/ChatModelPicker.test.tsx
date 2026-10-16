import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { EffectiveModel } from "../SettingsPanel/effective-models";
import type { ModelChoice } from "../SettingsPanel/model-choice";
import { ChatModelPicker } from "./ChatModelPicker";

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
  isDefault: false,
};

const GPT_MINI: ModelChoice = { providerId: "gpt", modelId: "gpt-5-mini" };

const chatDefault = (over: Partial<EffectiveModel> = {}): EffectiveModel => ({
  purpose: "chat",
  running: GPT_MINI,
  storedModelId: null,
  inherited: true,
  ...over,
});

type Over = {
  running?: ModelChoice | null;
  chosen?: boolean;
  chatDefault?: EffectiveModel;
};

const renderPicker = (over: Over = {}) => {
  const onModelChoose = vi.fn();
  const onModelFollow = vi.fn();
  render(
    <ChatModelPicker
      providers={[claude, gpt]}
      running={over.running ?? GPT_MINI}
      chosen={over.chosen ?? false}
      chatDefault={over.chatDefault ?? chatDefault()}
      onModelChoose={onModelChoose}
      onModelFollow={onModelFollow}
    />
  );
  return { onModelChoose, onModelFollow };
};

const select = () => screen.getByRole("combobox");
const selectedText = () =>
  (select() as HTMLSelectElement).selectedOptions[0]?.textContent;

describe("ChatModelPicker", () => {
  it("should select 'Same as main' naming the effective model, not the isDefault provider", () => {
    // Arrange

    // Act
    renderPicker();

    // Assert
    expect(selectedText()).toBe("Same as main model (GPT-5 mini · Mi GPT)");
  });

  it("should say it follows the chat setting when chat has its own model", () => {
    // Arrange
    const ownChat = chatDefault({
      inherited: false,
      storedModelId: "gpt-5-mini",
    });

    // Act
    renderPicker({ chatDefault: ownChat });

    // Assert
    expect(selectedText()).toBe(
      "Same as chat in Settings (GPT-5 mini · Mi GPT)"
    );
  });

  it("should select the conversation's own provider and model when it has one", () => {
    // Arrange
    const own = { providerId: "claude", modelId: "claude-opus-4-1" };

    // Act
    renderPicker({ running: own, chosen: true });

    // Assert
    expect(selectedText()).toBe("Claude Opus 4.1 · Mi Claude");
  });

  it("should offer every account's models in one list", () => {
    // Arrange

    // Act
    renderPicker();

    // Assert
    const groups = screen.getAllByRole("group").map((g) => g.label);
    expect(groups).toEqual(["Mi Claude · Anthropic", "Mi GPT · OpenAI"]);
  });

  it("should choose a provider and its model together", async () => {
    // Arrange
    const { onModelChoose } = renderPicker();

    // Act
    await userEvent.selectOptions(select(), "claude::claude-sonnet-5");

    // Assert
    expect(onModelChoose).toHaveBeenCalledWith({
      providerId: "claude",
      modelId: "claude-sonnet-5",
    });
  });

  it("should follow the main model again when 'Same as main' is picked", async () => {
    // Arrange
    const { onModelFollow, onModelChoose } = renderPicker({ chosen: true });

    // Act
    await userEvent.selectOptions(select(), "__inherit__");

    // Assert
    expect(onModelFollow).toHaveBeenCalledOnce();
    expect(onModelChoose).not.toHaveBeenCalled();
  });

  it("should never choose a blank custom model id", async () => {
    // Arrange
    const { onModelChoose } = renderPicker();
    await userEvent.selectOptions(select(), "claude::__custom__");

    // Act
    await userEvent.type(
      screen.getByTestId("model-choice-custom"),
      "  {Enter}"
    );

    // Assert
    expect(onModelChoose).not.toHaveBeenCalled();
  });

  it("should commit a custom model id for the account it belongs to", async () => {
    // Arrange
    const { onModelChoose } = renderPicker();
    await userEvent.selectOptions(select(), "gpt::__custom__");

    // Act
    await userEvent.type(
      screen.getByTestId("model-choice-custom"),
      "o9{Enter}"
    );

    // Assert
    expect(onModelChoose).toHaveBeenCalledWith({
      providerId: "gpt",
      modelId: "o9",
    });
  });
});
