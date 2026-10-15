import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "../../../test-utils";
import { AccountsSection } from "./AccountsSection";
import type { KeySaveOutcome } from "./save-with-key-check";

const renderSection = (outcome: KeySaveOutcome) => {
  const onAdd = vi.fn(async () => outcome);
  renderWithProviders(
    <AccountsSection
      providers={[]}
      handlers={{ onAdd, onRemove: vi.fn(), onUpdate: vi.fn() }}
    />
  );
  return onAdd;
};

const addOpenAi = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Add account" }));
  await userEvent.selectOptions(screen.getByLabelText("Provider"), "openai");
  await userEvent.type(screen.getByLabelText("API Key"), "sk-typed");
  await userEvent.click(screen.getByRole("button", { name: "Save account" }));
};

describe("AccountsSection", () => {
  it("should say the accounts are shared by every athlete", () => {
    // Arrange

    // Act
    renderSection("saved");

    // Assert
    expect(screen.getByText("Shared by every athlete.")).toBeInTheDocument();
  });

  it("should show the add form only once asked for", async () => {
    // Arrange
    renderSection("saved");
    const hiddenAtFirst = screen.queryByLabelText("API Key");

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Add account" }));

    // Assert
    expect(hiddenAtFirst).not.toBeInTheDocument();
    expect(screen.getByLabelText("API Key")).toBeInTheDocument();
  });

  it("should close the form after an add and reopen it blank, with no stale note", async () => {
    // Arrange
    renderSection("unverified");

    // Act
    await addOpenAi();
    const closed = screen.queryByLabelText("API Key");
    await userEvent.click(screen.getByRole("button", { name: "Add account" }));

    // Assert
    expect(closed).not.toBeInTheDocument();
    expect(screen.getByLabelText("Provider")).toHaveValue("anthropic");
    expect(screen.getByLabelText("API Key")).toHaveValue("");
    expect(screen.queryByText(/could not be checked/)).not.toBeInTheDocument();
  });

  it("should keep the form open when the provider rejects the key", async () => {
    // Arrange
    renderSection("invalid");

    // Act
    await addOpenAi();

    // Assert
    expect(screen.getByLabelText("API Key")).toHaveValue("sk-typed");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
