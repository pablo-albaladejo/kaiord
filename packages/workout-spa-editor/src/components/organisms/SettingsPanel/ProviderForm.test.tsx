import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "../../../test-utils";
import { ProviderForm } from "./ProviderForm";
import type { KeySaveOutcome } from "./save-with-key-check";

const fillAndSubmit = async () => {
  await userEvent.selectOptions(screen.getByLabelText("Provider"), "openai");
  await userEvent.type(screen.getByLabelText("Label"), "Work");
  await userEvent.type(screen.getByLabelText("API Key"), "sk-typed");
  await userEvent.click(screen.getByRole("button", { name: "Add Provider" }));
};

const renderForm = (outcome: KeySaveOutcome) => {
  const onAdd = vi.fn(async () => outcome);
  renderWithProviders(<ProviderForm onAdd={onAdd} />);
  return onAdd;
};

describe("ProviderForm", () => {
  it("should keep the typed key and say so when the provider rejects it", async () => {
    // Arrange
    const onAdd = renderForm("invalid");

    // Act
    await fillAndSubmit();

    // Assert
    expect(onAdd).toHaveBeenCalledWith({
      type: "openai",
      apiKey: "sk-typed",
      label: "Work",
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The provider rejected this key"
    );
    expect(screen.getByLabelText("API Key")).toHaveValue("sk-typed");
  });

  it("should clear the form once the key is saved", async () => {
    // Arrange
    renderForm("saved");

    // Act
    await fillAndSubmit();

    // Assert
    expect(screen.getByLabelText("API Key")).toHaveValue("");
    expect(screen.getByLabelText("Label")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should clear the form and note an unchecked key when the check is inconclusive", async () => {
    // Arrange
    renderForm("unverified");

    // Act
    await fillAndSubmit();

    // Assert
    expect(screen.getByLabelText("API Key")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent(
      "the key could not be checked"
    );
  });

  it("should not submit until both the label and the key are filled", async () => {
    // Arrange
    const onAdd = renderForm("saved");

    // Act
    await userEvent.type(screen.getByLabelText("Label"), "Work");

    // Assert
    expect(screen.getByRole("button", { name: "Add Provider" })).toBeDisabled();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
