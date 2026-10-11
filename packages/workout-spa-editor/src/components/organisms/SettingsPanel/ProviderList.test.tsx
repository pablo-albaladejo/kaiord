import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { renderWithProviders, screen } from "../../../test-utils";
import { ProviderList } from "./ProviderList";
import type { KeySaveOutcome } from "./save-with-key-check";

const provider: LlmProviderConfig = {
  id: "ai-1",
  type: "anthropic",
  apiKey: "sk-old",
  label: "Mine",
  isDefault: false,
  createdAt: 1,
};

const renderList = (outcome: KeySaveOutcome) => {
  const onUpdate = vi.fn(async () => outcome);
  renderWithProviders(
    <ProviderList
      providers={[provider]}
      onRemove={vi.fn()}
      onSetDefault={vi.fn()}
      onUpdate={onUpdate}
    />
  );
  return onUpdate;
};

const editKey = async (key: string) => {
  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  const input = screen.getByLabelText("API Key");
  await userEvent.clear(input);
  await userEvent.type(input, key);
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
};

describe("ProviderList", () => {
  it("should close the edit row once the new key is saved", async () => {
    // Arrange
    const onUpdate = renderList("saved");

    // Act
    await editKey("sk-new");

    // Assert
    expect(onUpdate).toHaveBeenCalledWith(provider, {
      label: "Mine",
      apiKey: "sk-new",
    });
    expect(screen.queryByLabelText("API Key")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  it("should keep the edit row open when the provider rejects the new key", async () => {
    // Arrange
    renderList("invalid");

    // Act
    await editKey("sk-bad");

    // Assert
    expect(screen.getByLabelText("API Key")).toHaveValue("sk-bad");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The provider rejected this key"
    );
  });

  it("should close the edit row and note an unchecked key when the check is inconclusive", async () => {
    // Arrange
    renderList("unverified");

    // Act
    await editKey("sk-new");

    // Assert
    expect(screen.queryByLabelText("API Key")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "the key could not be checked"
    );
  });

  it("should leave the edit row without saving on cancel", async () => {
    // Arrange
    const onUpdate = renderList("saved");
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Assert
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("API Key")).not.toBeInTheDocument();
  });

  it("should say no provider is configured when the list is empty", () => {
    // Arrange

    // Act
    renderWithProviders(
      <ProviderList
        providers={[]}
        onRemove={vi.fn()}
        onSetDefault={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByText("No providers configured. Add one below.")
    ).toBeInTheDocument();
  });
});
