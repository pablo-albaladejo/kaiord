import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ProfileFormData } from "../types";
import { PersonalDataTab } from "./PersonalDataTab";

const BASE: ProfileFormData = { name: "Athlete" };

describe("PersonalDataTab", () => {
  it("should render the physiological field inputs", () => {
    // Arrange
    const onChange = vi.fn();

    // Act
    render(<PersonalDataTab formData={BASE} onChange={onChange} />);

    // Assert
    expect(screen.getByLabelText("Height (cm)")).toBeInTheDocument();
    expect(screen.getByLabelText("Birth Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Sex")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Resting Heart Rate (bpm)")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Activity Level")).toBeInTheDocument();
  });

  it("should emit the parsed height when the user types a value", async () => {
    // Arrange
    const onChange = vi.fn();
    render(<PersonalDataTab formData={BASE} onChange={onChange} />);

    // Act
    await userEvent.type(screen.getByLabelText("Height (cm)"), "1");

    // Assert
    expect(onChange).toHaveBeenLastCalledWith({ ...BASE, height: 1 });
  });

  it("should emit the selected sex enum value", async () => {
    // Arrange
    const onChange = vi.fn();
    render(<PersonalDataTab formData={BASE} onChange={onChange} />);

    // Act
    await userEvent.selectOptions(screen.getByLabelText("Sex"), "female");

    // Assert
    expect(onChange).toHaveBeenLastCalledWith({ ...BASE, sex: "female" });
  });

  it("should clear activity level when the empty option is chosen", async () => {
    // Arrange
    const onChange = vi.fn();
    render(
      <PersonalDataTab
        formData={{ ...BASE, activityLevel: "active" }}
        onChange={onChange}
      />
    );

    // Act
    await userEvent.selectOptions(screen.getByLabelText("Activity Level"), "");

    // Assert
    expect(onChange).toHaveBeenLastCalledWith({
      ...BASE,
      activityLevel: undefined,
    });
  });
});
