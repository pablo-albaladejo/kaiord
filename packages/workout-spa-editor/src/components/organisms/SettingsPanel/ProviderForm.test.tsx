import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "../../../test-utils";
import { ProviderForm } from "./ProviderForm";
import type { KeySaveOutcome } from "./save-with-key-check";

const fillAndSubmit = async (label = "Work") => {
  await userEvent.selectOptions(screen.getByLabelText("Provider"), "openai");
  if (label)
    await userEvent.type(screen.getByLabelText("Label (optional)"), label);
  await userEvent.type(screen.getByLabelText("API Key"), "sk-typed");
  await userEvent.click(screen.getByRole("button", { name: "Save account" }));
};

const renderForm = (outcome: KeySaveOutcome) => {
  const onAdd = vi.fn(async () => outcome);
  const onDone = vi.fn();
  renderWithProviders(
    <ProviderForm onAdd={onAdd} onDone={onDone} onCancel={vi.fn()} />
  );
  return { onAdd, onDone };
};

describe("ProviderForm", () => {
  it("should keep the typed key and say so when the provider rejects it", async () => {
    // Arrange
    const { onAdd, onDone } = renderForm("invalid");

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
    expect(onDone).not.toHaveBeenCalled();
  });

  it.each<KeySaveOutcome>(["saved", "unverified"])(
    "should be done once the key is stored (%s)",
    async (outcome) => {
      // Arrange
      const { onDone } = renderForm(outcome);

      // Act
      await fillAndSubmit();

      // Assert
      expect(onDone).toHaveBeenCalledOnce();
    }
  );

  it("should add an account without a label", async () => {
    // Arrange
    const { onAdd } = renderForm("saved");

    // Act
    await fillAndSubmit("");

    // Assert
    expect(onAdd).toHaveBeenCalledWith({
      type: "openai",
      apiKey: "sk-typed",
      label: "",
    });
  });

  it("should lock the fields while the key is being checked", async () => {
    // Arrange
    let finish: (outcome: KeySaveOutcome) => void = () => {};
    const onAdd = vi.fn(
      () => new Promise<KeySaveOutcome>((resolve) => (finish = resolve))
    );
    renderWithProviders(
      <ProviderForm onAdd={onAdd} onDone={vi.fn()} onCancel={vi.fn()} />
    );

    // Act
    await fillAndSubmit();

    // Assert
    expect(screen.getByLabelText("Provider")).toBeDisabled();
    expect(screen.getByLabelText("Label (optional)")).toBeDisabled();
    expect(screen.getByLabelText("API Key")).toBeDisabled();
    finish("invalid");
    expect(await screen.findByLabelText("API Key")).toBeEnabled();
  });

  it("should not submit until the key is filled", async () => {
    // Arrange
    const { onAdd } = renderForm("saved");

    // Act
    await userEvent.type(screen.getByLabelText("Label (optional)"), "Work");

    // Assert
    expect(screen.getByRole("button", { name: "Save account" })).toBeDisabled();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
