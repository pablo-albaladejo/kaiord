import type { Target } from "@kaiord/core";
import { MissingFtpError } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { FTP_RESOLUTION as F, ZONE } from "../../test-utils/constants";
import { convertKrdTargetToGarmin } from "./target-to-garmin.converter";

const FTP_W = F.FTP_W;

const percentFtp = (value: number): Target => ({
  type: "power",
  value: { unit: "percent_ftp", value },
});

describe("convertKrdTargetToGarmin percent_ftp power", () => {
  it("should resolve a percent_ftp value to watts with the provided FTP", () => {
    // Arrange
    const target = percentFtp(F.SWEET_SPOT_PCT);

    // Act
    const result = convertKrdTargetToGarmin(target, { ftpWatts: FTP_W });

    // Assert
    expect(result.targetType.workoutTargetTypeKey).toBe("power.zone");
    expect(result.targetValueOne).toBe(F.SWEET_SPOT_W);
    expect(result.targetValueTwo).toBe(F.SWEET_SPOT_W);
    expect(result.zoneNumber).toBeNull();
  });

  it("should round the resolved watts to the nearest integer", () => {
    // Arrange
    const target = percentFtp(F.HALF_PCT);

    // Act
    const result = convertKrdTargetToGarmin(target, { ftpWatts: F.ODD_FTP_W });

    // Assert
    expect(result.targetValueOne).toBe(F.HALF_OF_ODD_FTP_W);
    expect(result.targetValueTwo).toBe(F.HALF_OF_ODD_FTP_W);
  });

  it("should throw MissingFtpError when no FTP is provided", () => {
    // Arrange
    const target = percentFtp(F.SWEET_SPOT_PCT);

    // Act
    const convert = () => convertKrdTargetToGarmin(target);

    // Assert
    expect(convert).toThrow(MissingFtpError);
  });

  it.each([0, F.NEGATIVE_FTP_W, Number.NaN, Number.POSITIVE_INFINITY])(
    "should throw MissingFtpError when the FTP is %s",
    (ftpWatts) => {
      // Arrange
      const target = percentFtp(F.SWEET_SPOT_PCT);

      // Act
      const convert = () => convertKrdTargetToGarmin(target, { ftpWatts });

      // Assert
      expect(convert).toThrow(MissingFtpError);
    }
  );

  it("should pass watts targets through unchanged when an FTP is provided", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "watts", value: F.STEADY_W },
    };

    // Act
    const result = convertKrdTargetToGarmin(target, { ftpWatts: FTP_W });

    // Assert
    expect(result.targetValueOne).toBe(F.STEADY_W);
    expect(result.targetValueTwo).toBe(F.STEADY_W);
  });

  it("should keep watt ranges fastest-first and unscaled when an FTP is provided", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "range", min: F.RANGE_LOW_W, max: F.RANGE_HIGH_W },
    };

    // Act
    const result = convertKrdTargetToGarmin(target, { ftpWatts: FTP_W });

    // Assert
    expect(result.targetValueOne).toBe(F.RANGE_HIGH_W);
    expect(result.targetValueTwo).toBe(F.RANGE_LOW_W);
  });

  it("should keep power zones as zone numbers without needing an FTP", () => {
    // Arrange
    const target: Target = {
      type: "power",
      value: { unit: "zone", value: ZONE.Z4 },
    };

    // Act
    const result = convertKrdTargetToGarmin(target);

    // Assert
    expect(result.zoneNumber).toBe(ZONE.Z4);
    expect(result.targetValueOne).toBeNull();
    expect(result.targetValueTwo).toBeNull();
  });
});
