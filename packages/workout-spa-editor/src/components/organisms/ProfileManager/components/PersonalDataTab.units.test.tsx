/* eslint-disable no-magic-numbers -- fixtures use literal measurement values for clarity */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ProfileFormData } from "../types";
import { PersonalDataTab } from "./PersonalDataTab";

vi.mock("../../../../contexts/units-context", () => ({
  useUnits: () => "imperial",
}));

describe("PersonalDataTab with imperial units", () => {
  it("should label and show weight and height in pounds and inches", () => {
    // Arrange
    const formData: ProfileFormData = {
      name: "Athlete",
      bodyWeight: 70,
      height: 175,
    };

    // Act
    render(<PersonalDataTab formData={formData} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByLabelText("Body Weight (lb)")).toHaveValue(154.3);
    expect(screen.getByLabelText("Height (in)")).toHaveValue(68.9);
    expect(screen.queryByLabelText("Body Weight (kg)")).not.toBeInTheDocument();
  });

  it("should store a typed pound value as kilograms", async () => {
    // Arrange
    const onChange = vi.fn();
    const formData: ProfileFormData = { name: "Athlete" };
    render(<PersonalDataTab formData={formData} onChange={onChange} />);

    // Act
    await userEvent.type(screen.getByLabelText("Body Weight (lb)"), "2");

    // Assert
    const last = onChange.mock.calls.at(-1)?.[0] as ProfileFormData;
    expect(last.bodyWeight).toBeCloseTo(0.907, 2);
  });
});
