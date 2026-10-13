import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CurrentWeightField } from "./CurrentWeightField";

const LABEL = "Current weight (kg)";
const STORED_KG = 72.5;
const LIVE_KG = 71.9;
const TYPED_KG = 70.1;

describe("CurrentWeightField", () => {
  it("should keep an in-progress edit when the live weight changes underneath", async () => {
    // Arrange
    const onSave = vi.fn();
    const { rerender } = render(
      <CurrentWeightField currentKg={STORED_KG} onSave={onSave} />
    );
    const field = screen.getByLabelText(LABEL);
    await userEvent.clear(field);
    await userEvent.type(field, String(TYPED_KG));

    // Act
    rerender(<CurrentWeightField currentKg={LIVE_KG} onSave={onSave} />);
    await userEvent.type(field, "{Enter}");

    // Assert
    expect(field).toHaveValue(TYPED_KG);
    expect(onSave).toHaveBeenCalledWith(TYPED_KG);
  });

  it("should show the live weight once the saved value lands", async () => {
    // Arrange
    const onSave = vi.fn();
    const { rerender } = render(
      <CurrentWeightField currentKg={STORED_KG} onSave={onSave} />
    );
    const field = screen.getByLabelText(LABEL);
    await userEvent.clear(field);
    await userEvent.type(field, `${TYPED_KG}{Enter}`);

    // Act
    rerender(<CurrentWeightField currentKg={LIVE_KG} onSave={onSave} />);

    // Assert
    expect(field).toHaveValue(LIVE_KG);
  });

  it("should record the value once when Enter is followed by a blur", async () => {
    // Arrange
    const onSave = vi.fn();
    render(<CurrentWeightField currentKg={STORED_KG} onSave={onSave} />);
    const field = screen.getByLabelText(LABEL);

    // Act
    await userEvent.clear(field);
    await userEvent.type(field, `${TYPED_KG}{Enter}`);
    await userEvent.tab();

    // Assert
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
