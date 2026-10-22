import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Target } from "../../../types/krd";
import { TargetPicker } from "./TargetPicker";

const RAMP_LOW = 50;
const RAMP_HIGH = 75;

const powerRange = (basis?: "percent_ftp"): Target => ({
  type: "power",
  value: { unit: "range", min: RAMP_LOW, max: RAMP_HIGH, basis },
});

describe("TargetPicker range unit", () => {
  it("should label percent_ftp range bounds in % FTP", () => {
    // Arrange
    const value = powerRange("percent_ftp");

    // Act
    render(<TargetPicker value={value} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByText("Minimum (% FTP)")).toBeInTheDocument();
    expect(screen.getByText("Maximum (% FTP)")).toBeInTheDocument();
  });

  it("should label basis-less power range bounds in watts", () => {
    // Arrange
    const value = powerRange();

    // Act
    render(<TargetPicker value={value} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByText("Minimum (W)")).toBeInTheDocument();
    expect(screen.getByText("Maximum (W)")).toBeInTheDocument();
  });
});
