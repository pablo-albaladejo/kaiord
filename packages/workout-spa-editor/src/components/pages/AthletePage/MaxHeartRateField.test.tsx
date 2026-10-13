import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MaxHeartRateField } from "./MaxHeartRateField";

const LABEL = "Max Heart Rate (bpm)";
const MAX_HR = 185;

describe("MaxHeartRateField", () => {
  it("should save exactly once, with the final value, when 185 is typed", async () => {
    // Arrange
    const onSave = vi.fn();
    render(<MaxHeartRateField initial={undefined} onSave={onSave} />);

    // Act
    await userEvent.type(screen.getByLabelText(LABEL), String(MAX_HR));
    expect(onSave).not.toHaveBeenCalled();
    await userEvent.tab();

    // Assert
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(MAX_HR);
  });

  it("should not save twice when Enter is followed by blur", async () => {
    // Arrange
    const onSave = vi.fn();
    render(<MaxHeartRateField initial={undefined} onSave={onSave} />);

    // Act
    await userEvent.type(screen.getByLabelText(LABEL), `${MAX_HR}{Enter}`);
    await userEvent.tab();

    // Assert
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("should flag an out-of-range value on blur and not save it", async () => {
    // Arrange
    const onSave = vi.fn();
    render(<MaxHeartRateField initial={undefined} onSave={onSave} />);

    // Act
    await userEvent.type(screen.getByLabelText(LABEL), "300");
    await userEvent.tab();

    // Assert
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/between 1 and 250/i)).toBeInTheDocument();
  });
});
