import { describe, expect, it } from "vitest";

import type { Target } from "../../../types/krd";
import { keepPowerBasis } from "./keep-power-basis";

const RAMP_LOW = 50;
const RAMP_HIGH = 75;
const EDITED_HIGH = 80;

const range = (max: number, basis?: "percent_ftp"): Target => ({
  type: "power",
  value: { unit: "range", min: RAMP_LOW, max, ...(basis && { basis }) },
});

describe("keepPowerBasis", () => {
  it("should keep the percent_ftp basis when a range's bounds are edited", () => {
    // Arrange
    const previous = range(RAMP_HIGH, "percent_ftp");

    // Act
    const result = keepPowerBasis(previous, range(EDITED_HIGH));

    // Assert
    expect(result).toStrictEqual(range(EDITED_HIGH, "percent_ftp"));
  });

  it("should leave a watts range edit untouched", () => {
    // Arrange
    const next = range(EDITED_HIGH);

    // Act
    const result = keepPowerBasis(range(RAMP_HIGH), next);

    // Assert
    expect(result).toBe(next);
  });

  it("should not add a basis to a target that is not a power range", () => {
    // Arrange
    const next: Target = {
      type: "power",
      value: { unit: "percent_ftp", value: RAMP_HIGH },
    };

    // Act
    const result = keepPowerBasis(range(RAMP_HIGH, "percent_ftp"), next);

    // Assert
    expect(result).toBe(next);
  });

  it("should pass a cleared target through", () => {
    // Arrange
    const previous = range(RAMP_HIGH, "percent_ftp");

    // Act
    const result = keepPowerBasis(previous, null);

    // Assert
    expect(result).toBeNull();
  });
});
