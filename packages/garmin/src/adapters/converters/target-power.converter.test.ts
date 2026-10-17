import { describe, expect, it } from "vitest";

import { resolvePercentFtpToWatts } from "./target-power.converter";

const FTP_WATTS = 330;
const NEGATIVE_FTP = -5;

describe("resolvePercentFtpToWatts", () => {
  it("should resolve a percent_ftp value to watts with the FTP", () => {
    // Arrange
    const value = { unit: "percent_ftp", value: 35 };

    // Act
    const result = resolvePercentFtpToWatts(value, FTP_WATTS);

    // Assert
    expect(result).toEqual({ unit: "watts", value: 116 });
  });

  it("should pass non-percent values through without an FTP", () => {
    // Arrange
    const value = { unit: "range", min: 150, max: 200 };

    // Act
    const result = resolvePercentFtpToWatts(value, undefined);

    // Assert
    expect(result).toBe(value);
  });

  it.each([undefined, 0, NEGATIVE_FTP, Number.NaN, Number.POSITIVE_INFINITY])(
    "should throw MissingFtpError for an unusable FTP (%s)",
    (ftpWatts) => {
      // Arrange
      const value = { unit: "percent_ftp", value: 85 };

      // Act
      const act = () => resolvePercentFtpToWatts(value, ftpWatts);

      // Assert
      expect(act).toThrow(expect.objectContaining({ name: "MissingFtpError" }));
    }
  );
});
