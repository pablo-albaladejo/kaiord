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

  it("should name the successor used in place of a retired saved model", () => {
    // Arrange
    const retired = "claude-3-haiku-20240307";

    // Act
    render(<ModelPicker type="anthropic" value={retired} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByTestId("model-picker-retired")).toHaveTextContent(
      "claude-3-haiku-20240307 was retired by the provider — using claude-haiku-4-5 instead."
    );
  });

  it("should hint at the successor of a deprecated saved model", () => {
    // Arrange
    const deprecated = "claude-sonnet-4-0";

    // Act
    render(
      <ModelPicker type="anthropic" value={deprecated} onChange={vi.fn()} />
    );

    // Assert
    expect(screen.getByTestId("model-picker-deprecated")).toHaveTextContent(
      "claude-sonnet-4-0 is deprecated and will be retired — consider claude-sonnet-5."
    );
    expect(
      screen.queryByTestId("model-picker-retired")
    ).not.toBeInTheDocument();
  });

  it("should not offer a retired model as a catalog option", () => {
    // Arrange
    const retired = "claude-3-haiku-20240307";

    // Act
    render(<ModelPicker type="anthropic" value="" onChange={vi.fn()} />);

    // Assert
    expect(
      screen.queryByRole("option", { name: retired })
    ).not.toBeInTheDocument();
  });

  it("should not warn for a current catalog model", () => {
    // Arrange
    const current = PROVIDER_MODELS.anthropic[0]!.id;

    // Act
    render(<ModelPicker type="anthropic" value={current} onChange={vi.fn()} />);

    // Assert
    expect(
      screen.queryByTestId("model-picker-retired")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("model-picker-deprecated")
    ).not.toBeInTheDocument();
  });
});
