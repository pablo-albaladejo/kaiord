import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { IntakeLoggerForm } from "./IntakeLoggerForm";

const DATE = "2026-06-21";

const setup = () => {
  const logEntry = vi.fn().mockResolvedValue(true);
  const savePreset = vi.fn().mockResolvedValue(true);
  render(<IntakeLoggerForm date={DATE} actions={{ logEntry, savePreset }} />);
  return { logEntry, savePreset };
};

describe("IntakeLoggerForm", () => {
  it("should log an entry with the parsed kcal and macros", async () => {
    // Arrange
    const user = userEvent.setup();
    const { logEntry } = setup();

    // Act
    await user.type(screen.getByLabelText("Energy (kcal)"), "600");
    await user.type(screen.getByLabelText("Protein (g)"), "40");
    await user.click(screen.getByTestId("intake-log-submit"));

    // Assert
    expect(logEntry).toHaveBeenCalledWith(DATE, {
      kcal: 600,
      proteinG: 40,
      carbG: 0,
      fatG: 0,
      label: undefined,
      mealSlot: undefined,
    });
  });

  it("should disable the submit and show an error for a negative macro", async () => {
    // Arrange
    const user = userEvent.setup();
    const { logEntry } = setup();

    // Act
    await user.type(screen.getByLabelText("Energy (kcal)"), "600");
    await user.type(screen.getByLabelText("Fat (g)"), "-5");

    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Values must be zero or greater"
    );
    expect(screen.getByTestId("intake-log-submit")).toBeDisabled();
    expect(logEntry).not.toHaveBeenCalled();
  });

  it("should save a preset only when a label is present", async () => {
    // Arrange
    const user = userEvent.setup();
    const { savePreset } = setup();

    // Act
    await user.type(screen.getByLabelText("Energy (kcal)"), "300");
    await user.type(screen.getByLabelText("Label"), "Yogurt");
    await user.click(screen.getByTestId("intake-save-preset"));

    // Assert
    expect(savePreset).toHaveBeenCalledWith(
      expect.objectContaining({ kcal: 300, label: "Yogurt" }),
      "Yogurt"
    );
  });
});
