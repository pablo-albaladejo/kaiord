import { describe, expect, it } from "vitest";

import {
  CADENCE_RPM,
  CADENCE_SPM,
  INTENSITY_RATIO,
  PACE_SECONDS_PER_KM,
  PERCENT_FTP,
  SPEED_MPS,
} from "../../test-utils";
import {
  convertKrdCadenceToZwift,
  convertKrdPaceToZwift,
  convertKrdPowerRangeToZwift,
  convertKrdPowerToZwift,
  convertZwiftCadenceTarget,
  convertZwiftPaceTarget,
  convertZwiftPowerRange,
  convertZwiftPowerTarget,
} from "./target.converter";

describe("Zwift to KRD target converters", () => {
  describe("convertZwiftPowerTarget", () => {
    it("should convert Zwift FTP percentage to KRD percent_ftp", () => {
      // Arrange
      const ftpPercentage = INTENSITY_RATIO.EIGHTY_FIVE;

      // Act
      const result = convertZwiftPowerTarget(ftpPercentage);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "percent_ftp",
          value: PERCENT_FTP.EIGHTY_FIVE,
        },
      });
    });

    it("should handle low power target", () => {
      // Arrange
      const ftpPercentage = INTENSITY_RATIO.HALF;

      // Act
      const result = convertZwiftPowerTarget(ftpPercentage);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "percent_ftp",
          value: PERCENT_FTP.FIFTY,
        },
      });
    });

    it("should handle high power target", () => {
      // Arrange
      const ftpPercentage = INTENSITY_RATIO.ONE_AND_HALF;

      // Act
      const result = convertZwiftPowerTarget(ftpPercentage);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "percent_ftp",
          value: PERCENT_FTP.ONE_FIFTY,
        },
      });
    });

    it("should handle maximum power target", () => {
      // Arrange
      const ftpPercentage = INTENSITY_RATIO.TRIPLE;

      // Act
      const result = convertZwiftPowerTarget(ftpPercentage);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "percent_ftp",
          value: PERCENT_FTP.THREE_HUNDRED,
        },
      });
    });
  });

  describe("convertZwiftPowerRange", () => {
    it("should convert Zwift power range to KRD range target", () => {
      // Arrange
      const powerLow = INTENSITY_RATIO.SIXTY;
      const powerHigh = INTENSITY_RATIO.EIGHTY;

      // Act
      const result = convertZwiftPowerRange(powerLow, powerHigh);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "range",
          min: PERCENT_FTP.SIXTY,
          max: PERCENT_FTP.EIGHTY,
        },
      });
    });

    it("should handle warmup power range", () => {
      // Arrange
      const powerLow = INTENSITY_RATIO.HALF;
      const powerHigh = INTENSITY_RATIO.SEVENTY_FIVE;

      // Act
      const result = convertZwiftPowerRange(powerLow, powerHigh);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "range",
          min: PERCENT_FTP.FIFTY,
          max: PERCENT_FTP.SEVENTY_FIVE,
        },
      });
    });

    it("should handle cooldown power range", () => {
      // Arrange
      const powerLow = INTENSITY_RATIO.SEVENTY_FIVE;
      const powerHigh = INTENSITY_RATIO.HALF;

      // Act
      const result = convertZwiftPowerRange(powerLow, powerHigh);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "range",
          min: PERCENT_FTP.SEVENTY_FIVE,
          max: PERCENT_FTP.FIFTY,
        },
      });
    });
  });

  describe("convertZwiftPaceTarget", () => {
    it("should convert Zwift pace to KRD meters per second", () => {
      // Arrange
      const secPerKm = PACE_SECONDS_PER_KM.MODERATE;

      // Act
      const result = convertZwiftPaceTarget(secPerKm);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "mps",
          value: SPEED_MPS.PACE_3_333,
        },
      });
    });

    it("should handle fast pace", () => {
      // Arrange
      const secPerKm = PACE_SECONDS_PER_KM.FAST;

      // Act
      const result = convertZwiftPaceTarget(secPerKm);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "mps",
          value: SPEED_MPS.PACE_4_167_FULL,
        },
      });
    });

    it("should handle slow pace", () => {
      // Arrange
      const secPerKm = PACE_SECONDS_PER_KM.SLOW;

      // Act
      const result = convertZwiftPaceTarget(secPerKm);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "mps",
          value: SPEED_MPS.PACE_2_778_FULL,
        },
      });
    });
  });

  describe("convertZwiftCadenceTarget", () => {
    it("should convert Zwift cadence for cycling", () => {
      // Arrange
      const cadence = CADENCE_RPM.HIGH;
      const isRunning = false;

      // Act
      const result = convertZwiftCadenceTarget(cadence, isRunning);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: CADENCE_RPM.HIGH,
        },
      });
    });

    it("should convert Zwift cadence for running with spm to rpm conversion", () => {
      // Arrange
      const cadence = CADENCE_SPM.STANDARD;
      const isRunning = true;

      // Act
      const result = convertZwiftCadenceTarget(cadence, isRunning);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: CADENCE_RPM.HIGH,
        },
      });
    });

    it("should handle low cycling cadence", () => {
      // Arrange
      const cadence = CADENCE_RPM.LOW;

      // Act
      const result = convertZwiftCadenceTarget(cadence);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: CADENCE_RPM.LOW,
        },
      });
    });

    it("should handle high cycling cadence", () => {
      // Arrange
      const cadence = CADENCE_RPM.RACE;

      // Act
      const result = convertZwiftCadenceTarget(cadence);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: CADENCE_RPM.RACE,
        },
      });
    });

    it("should handle running cadence with default isRunning false", () => {
      // Arrange
      const cadence = CADENCE_RPM.REST;

      // Act
      const result = convertZwiftCadenceTarget(cadence);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: CADENCE_RPM.REST,
        },
      });
    });
  });
});

describe("KRD to Zwift target converters", () => {
  describe("convertKrdPowerToZwift", () => {
    it("should convert KRD percent_ftp to Zwift FTP percentage", () => {
      // Arrange
      const percentFtp = PERCENT_FTP.EIGHTY_FIVE;

      // Act
      const result = convertKrdPowerToZwift(percentFtp);

      // Assert
      expect(result).toBe(INTENSITY_RATIO.EIGHTY_FIVE);
    });

    it("should handle low power", () => {
      // Arrange
      const percentFtp = PERCENT_FTP.FIFTY;

      // Act
      const result = convertKrdPowerToZwift(percentFtp);

      // Assert
      expect(result).toBe(INTENSITY_RATIO.HALF);
    });

    it("should handle high power", () => {
      // Arrange
      const percentFtp = PERCENT_FTP.ONE_FIFTY;

      // Act
      const result = convertKrdPowerToZwift(percentFtp);

      // Assert
      expect(result).toBe(INTENSITY_RATIO.ONE_AND_HALF);
    });

    it("should handle maximum power", () => {
      // Arrange
      const percentFtp = PERCENT_FTP.THREE_HUNDRED;

      // Act
      const result = convertKrdPowerToZwift(percentFtp);

      // Assert
      expect(result).toBe(INTENSITY_RATIO.TRIPLE);
    });
  });

  describe("convertKrdPowerRangeToZwift", () => {
    it("should convert KRD power range to Zwift PowerLow/PowerHigh", () => {
      // Arrange
      const min = PERCENT_FTP.SIXTY;
      const max = PERCENT_FTP.EIGHTY;

      // Act
      const result = convertKrdPowerRangeToZwift(min, max);

      // Assert
      expect(result).toStrictEqual([
        INTENSITY_RATIO.SIXTY,
        INTENSITY_RATIO.EIGHTY,
      ]);
    });

    it("should handle warmup range", () => {
      // Arrange
      const min = PERCENT_FTP.FIFTY;
      const max = PERCENT_FTP.SEVENTY_FIVE;

      // Act
      const result = convertKrdPowerRangeToZwift(min, max);

      // Assert
      expect(result).toStrictEqual([
        INTENSITY_RATIO.HALF,
        INTENSITY_RATIO.SEVENTY_FIVE,
      ]);
    });

    it("should handle cooldown range", () => {
      // Arrange
      const min = PERCENT_FTP.SEVENTY_FIVE;
      const max = PERCENT_FTP.FIFTY;

      // Act
      const result = convertKrdPowerRangeToZwift(min, max);

      // Assert
      expect(result).toStrictEqual([
        INTENSITY_RATIO.SEVENTY_FIVE,
        INTENSITY_RATIO.HALF,
      ]);
    });
  });

  describe("convertKrdPaceToZwift", () => {
    it("should convert KRD meters per second to Zwift seconds per kilometer", () => {
      // Arrange
      const metersPerSecond = SPEED_MPS.PACE_3_333;

      // Act
      const result = convertKrdPaceToZwift(metersPerSecond);

      // Assert
      expect(result).toBeCloseTo(PACE_SECONDS_PER_KM.MODERATE, 1);
    });

    it("should handle fast pace", () => {
      // Arrange
      const metersPerSecond = SPEED_MPS.PACE_4_167_FULL;

      // Act
      const result = convertKrdPaceToZwift(metersPerSecond);

      // Assert
      expect(result).toBeCloseTo(PACE_SECONDS_PER_KM.FAST, 1);
    });

    it("should handle slow pace", () => {
      // Arrange
      const metersPerSecond = SPEED_MPS.PACE_2_778_FULL;

      // Act
      const result = convertKrdPaceToZwift(metersPerSecond);

      // Assert
      expect(result).toBeCloseTo(PACE_SECONDS_PER_KM.SLOW, 1);
    });
  });

  describe("convertKrdCadenceToZwift", () => {
    it("should convert KRD cadence for cycling", () => {
      // Arrange
      const rpm = CADENCE_RPM.HIGH;
      const isRunning = false;

      // Act
      const result = convertKrdCadenceToZwift(rpm, isRunning);

      // Assert
      expect(result).toBe(CADENCE_RPM.HIGH);
    });

    it("should convert KRD cadence for running with rpm to spm conversion", () => {
      // Arrange
      const rpm = CADENCE_RPM.HIGH;
      const isRunning = true;

      // Act
      const result = convertKrdCadenceToZwift(rpm, isRunning);

      // Assert
      expect(result).toBe(CADENCE_SPM.STANDARD);
    });

    it("should handle low cycling cadence", () => {
      // Arrange
      const rpm = CADENCE_RPM.LOW;

      // Act
      const result = convertKrdCadenceToZwift(rpm);

      // Assert
      expect(result).toBe(CADENCE_RPM.LOW);
    });

    it("should handle high cycling cadence", () => {
      // Arrange
      const rpm = CADENCE_RPM.RACE;

      // Act
      const result = convertKrdCadenceToZwift(rpm);

      // Assert
      expect(result).toBe(CADENCE_RPM.RACE);
    });

    it("should handle running cadence with default isRunning false", () => {
      // Arrange
      const rpm = CADENCE_RPM.REST;

      // Act
      const result = convertKrdCadenceToZwift(rpm);

      // Assert
      expect(result).toBe(CADENCE_RPM.REST);
    });
  });
});
