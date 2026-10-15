import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../test-utils";
import { CustomModelInput } from "./CustomModelInput";

const renderInput = () => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <CustomModelInput onCommit={onCommit} onCancel={onCancel} />
  );
  const input = screen.getByTestId("model-choice-custom");
  fireEvent.change(input, { target: { value: "my-model" } });
  return { input, onCommit, onCancel };
};

describe("CustomModelInput", () => {
  it("should commit once when Enter is followed by a blur", () => {
    // Arrange
    const { input, onCommit } = renderInput();

    // Act
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.blur(input);

    // Assert
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("my-model");
  });

  it("should not commit on a blur that follows Escape", () => {
    // Arrange
    const { input, onCommit, onCancel } = renderInput();

    // Act
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.blur(input);

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("should commit on blur alone", () => {
    // Arrange
    const { input, onCommit } = renderInput();

    // Act
    fireEvent.blur(input);

    // Assert
    expect(onCommit).toHaveBeenCalledWith("my-model");
  });
});
