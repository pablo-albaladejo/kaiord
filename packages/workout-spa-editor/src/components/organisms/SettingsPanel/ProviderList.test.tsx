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
      onUpdate={onUpdate}
    />
  );
  return onUpdate;
};

const replaceKey = async (key: string) => {
  await userEvent.click(screen.getByRole("button", { name: "Replace key" }));
  await userEvent.type(screen.getByLabelText("New API key"), key);
  await userEvent.click(screen.getByRole("button", { name: "Save" }));
};

describe("ProviderList", () => {
  it("should replace only the key, leaving the name alone, closing once it is saved", async () => {
    // Arrange
    const onUpdate = renderList("saved");

    // Act
    await replaceKey("sk-new");

    // Assert
    expect(onUpdate).toHaveBeenCalledWith(provider, {
      label: undefined,
      apiKey: "sk-new",
    });
    expect(screen.queryByLabelText("New API key")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replace key" })).toBeVisible();
  });

  it("should keep the key field open when the provider rejects the new key", async () => {
    // Arrange
    renderList("invalid");

    // Act
    await replaceKey("sk-bad");

    // Assert
    expect(screen.getByLabelText("New API key")).toHaveValue("sk-bad");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The provider rejected this key"
    );
  });

  it("should close when the key could not be checked, leaving no stale note", async () => {
    // Arrange
    renderList("unverified");

    // Act
    await replaceKey("sk-new");

    // Assert
    expect(screen.queryByLabelText("New API key")).not.toBeInTheDocument();
    expect(screen.queryByText(/could not be checked/)).not.toBeInTheDocument();
  });

  it("should leave the key field without saving on cancel", async () => {
    // Arrange
    const onUpdate = renderList("saved");
    await userEvent.click(screen.getByRole("button", { name: "Replace key" }));

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Assert
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("New API key")).not.toBeInTheDocument();
  });

  it("should say no account is configured when the list is empty", () => {
    // Arrange

    // Act
    renderWithProviders(
      <ProviderList providers={[]} onRemove={vi.fn()} onUpdate={vi.fn()} />
    );

    // Assert
    expect(screen.getByText("No AI accounts yet.")).toBeInTheDocument();
  });

  it("should open the key field empty, never echoing the stored key", async () => {
    // Arrange
    renderList("saved");

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Replace key" }));

    // Assert
    expect(screen.getByLabelText("New API key")).toHaveValue("");
    expect(document.body.innerHTML).not.toContain("sk-old");
  });

  it("should rename without touching the stored key", async () => {
    // Arrange
    const onUpdate = renderList("saved");
    await userEvent.click(
      screen.getByRole("button", { name: "More actions for Mine" })
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Rename" }));

    // Act
    await userEvent.clear(screen.getByLabelText("Label"));
    await userEvent.type(screen.getByLabelText("Label"), "Renamed");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    expect(onUpdate).toHaveBeenCalledWith(provider, {
      label: "Renamed",
      apiKey: undefined,
    });
  });

  it("should store a replaced key without the spaces pasted around it", async () => {
    // Arrange
    const onUpdate = renderList("saved");

    // Act
    await replaceKey("  sk-new  ");

    // Assert
    expect(onUpdate).toHaveBeenCalledWith(provider, {
      label: undefined,
      apiKey: "sk-new",
    });
  });
});
