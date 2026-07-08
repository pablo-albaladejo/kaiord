import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ValidationError } from "../../../types/krd";
import { ValidationErrorList } from "./ValidationErrorList";

describe("ValidationErrorList", () => {
  it("should render the dictionary copy for an error carrying a known code", () => {
    // Arrange
    const errors: Array<ValidationError> = [
      {
        path: ["target", "min"],
        message: "raw upstream text",
        code: "min_gt_max",
      },
    ];

    // Act
    render(<ValidationErrorList errors={errors} />);

    // Assert
    expect(
      screen.getByText(/min must be less than or equal to max/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/raw upstream text/)).not.toBeInTheDocument();
  });

  it("should render the upstream message verbatim for a codeless error", () => {
    // Arrange
    const errors: Array<ValidationError> = [
      { path: ["version"], message: "Required field missing" },
    ];

    // Act
    render(<ValidationErrorList errors={errors} />);

    // Assert
    expect(screen.getByText(/Required field missing/)).toBeInTheDocument();
  });
});
