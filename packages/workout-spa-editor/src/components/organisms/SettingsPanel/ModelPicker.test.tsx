import { PROVIDER_MODELS } from "@kaiord/ai/providers";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ModelPicker } from "./ModelPicker";

describe("ModelPicker", () => {
  it("should call onChange with the catalog model id when one is selected", async () => {
    // Arrange
    const onChange = vi.fn();
    const target = PROVIDER_MODELS.anthropic[1]!;
    render(<ModelPicker type="anthropic" value="" onChange={onChange} />);

    // Act
    await userEvent.selectOptions(
      screen.getByTestId("model-picker-select"),
      target.id
    );

    // Assert
    expect(onChange).toHaveBeenCalledWith(target.id);
  });

  it("should call onChange with the typed value when a custom id is entered", async () => {
    // Arrange
    const onChange = vi.fn();
    render(<ModelPicker type="anthropic" value="" onChange={onChange} />);

    // Act
    await userEvent.selectOptions(
      screen.getByTestId("model-picker-select"),
      "__custom__"
    );
    await userEvent.type(screen.getByTestId("model-picker-custom"), "x");

    // Assert
    expect(onChange).toHaveBeenLastCalledWith("x");
  });

  it("should reveal the custom input when the value is outside the catalog", () => {
    // Arrange

    // Act
    render(
      <ModelPicker
        type="anthropic"
        value="my-custom-model"
        onChange={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByTestId("model-picker-custom")).toHaveValue(
      "my-custom-model"
    );
  });
});
