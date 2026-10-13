/* eslint-disable no-magic-numbers -- fixtures use literal measurement values for clarity */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BodyFormData } from "./body-form-data";
import { PhysiologyFields } from "./PhysiologyFields";

vi.mock("../../../contexts/units-context", () => ({
  useUnits: () => "imperial",
}));

describe("PhysiologyFields with imperial units", () => {
  it("should label and show height in inches", () => {
    // Arrange
    const formData: BodyFormData = { height: 175 };

    // Act
    render(<PhysiologyFields formData={formData} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByLabelText("Height (in)")).toHaveValue(68.9);
    expect(screen.queryByLabelText("Height (cm)")).not.toBeInTheDocument();
  });
});
