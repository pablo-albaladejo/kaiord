import { describe, expect, it } from "vitest";

import {
  createMissingMaxHeartRateError,
  MissingMaxHeartRateError,
} from "./missing-max-heart-rate-error";

describe("MissingMaxHeartRateError", () => {
  it("should expose the adapter name and a stable error name", () => {
    // Arrange
    const adapterName = "garmin";

    // Act
    const error = createMissingMaxHeartRateError(adapterName);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MissingMaxHeartRateError);
    expect(error.adapterName).toBe(adapterName);
    expect(error.name).toBe("MissingMaxHeartRateError");
  });

  it("should name the adapter and the percent_max unit in the message", () => {
    // Arrange
    const adapterName = "garmin";

    // Act
    const error = new MissingMaxHeartRateError(adapterName);

    // Assert
    expect(error.message).toContain(adapterName);
    expect(error.message).toContain("percent_max");
    expect(error.message).toContain("max heart rate");
  });
});
