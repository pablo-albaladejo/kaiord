/* eslint-disable no-magic-numbers -- fixtures use literal measurement values for clarity */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ProfileFormData } from "../types";
import { PersonalDataTab } from "./PersonalDataTab";

vi.mock("../../../../contexts/units-context", () => ({
  useUnits: () => "imperial",
}));

describe("PersonalDataTab with imperial units", () => {
  it("should label and show height in inches", () => {
    // Arrange
    const formData: ProfileFormData = { name: "Athlete", height: 175 };

    // Act
    render(<PersonalDataTab formData={formData} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByLabelText("Height (in)")).toHaveValue(68.9);
    expect(screen.queryByLabelText("Height (cm)")).not.toBeInTheDocument();
  });
});
