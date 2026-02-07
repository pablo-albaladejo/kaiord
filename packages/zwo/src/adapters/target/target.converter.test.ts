import { describe, expect, it } from "vitest";
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
      const ftpPercentage = 0.85;

      // Act
      const result = convertZwiftPowerTarget(ftpPercentage);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "percent_ftp",
          value: 85,
        },
      });
    });

    it("should handle low power target", () => {
      // Arrange
      const ftpPercentage = 0.5;

      // Act
      const result = convertZwiftPowerTarget(ftpPercentage);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "percent_ftp",
          value: 50,
        },
      });
    });

    it("should handle high power target", () => {
      // Arrange
      const ftpPercentage = 1.5;

      // Act
      const result = convertZwiftPowerTarget(ftpPercentage);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "percent_ftp",
          value: 150,
        },
      });
    });

    it("should handle maximum power target", () => {
      // Arrange
      const ftpPercentage = 3.0;

      // Act
      const result = convertZwiftPowerTarget(ftpPercentage);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "percent_ftp",
          value: 300,
        },
      });
    });
  });

  describe("convertZwiftPowerRange", () => {
    it("should convert Zwift power range to KRD range target", () => {
      // Arrange
      const powerLow = 0.6;
      const powerHigh = 0.8;

      // Act
      const result = convertZwiftPowerRange(powerLow, powerHigh);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "range",
          min: 60,
          max: 80,
        },
      });
    });

    it("should handle warmup power range", () => {
      // Arrange
      const powerLow = 0.5;
      const powerHigh = 0.75;

      // Act
      const result = convertZwiftPowerRange(powerLow, powerHigh);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "range",
          min: 50,
          max: 75,
        },
      });
    });

    it("should handle cooldown power range", () => {
      // Arrange
      const powerLow = 0.75;
      const powerHigh = 0.5;

      // Act
      const result = convertZwiftPowerRange(powerLow, powerHigh);

      // Assert
      expect(result).toStrictEqual({
        type: "power",
        value: {
          unit: "range",
          min: 75,
          max: 50,
        },
      });
    });
  });

  describe("convertZwiftPaceTarget", () => {
    it("should convert Zwift pace to KRD meters per second", () => {
      // Arrange
      const secPerKm = 300;

      // Act
      const result = convertZwiftPaceTarget(secPerKm);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "mps",
          value: 3.3333333333333335,
        },
      });
    });

    it("should handle fast pace", () => {
      // Arrange
      const secPerKm = 240;

      // Act
      const result = convertZwiftPaceTarget(secPerKm);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "mps",
          value: 4.166666666666667,
        },
      });
    });

    it("should handle slow pace", () => {
      // Arrange
      const secPerKm = 360;

      // Act
      const result = convertZwiftPaceTarget(secPerKm);

      // Assert
      expect(result).toStrictEqual({
        type: "pace",
        value: {
          unit: "mps",
          value: 2.7777777777777777,
        },
      });
    });
  });

  describe("convertZwiftCadenceTarget", () => {
    it("should convert Zwift cadence for cycling", () => {
      // Arrange
      const cadence = 90;
      const isRunning = false;

      // Act
      const result = convertZwiftCadenceTarget(cadence, isRunning);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: 90,
        },
      });
    });

    it("should convert Zwift cadence for running with spm to rpm conversion", () => {
      // Arrange
      const cadence = 180;
      const isRunning = true;

      // Act
      const result = convertZwiftCadenceTarget(cadence, isRunning);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: 90,
        },
      });
    });

    it("should handle low cycling cadence", () => {
      // Arrange
      const cadence = 60;

      // Act
      const result = convertZwiftCadenceTarget(cadence);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: 60,
        },
      });
    });

    it("should handle high cycling cadence", () => {
      // Arrange
      const cadence = 120;

      // Act
      const result = convertZwiftCadenceTarget(cadence);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: 120,
        },
      });
    });

    it("should handle running cadence with default isRunning false", () => {
      // Arrange
      const cadence = 85;

      // Act
      const result = convertZwiftCadenceTarget(cadence);

      // Assert
      expect(result).toStrictEqual({
        type: "cadence",
        value: {
          unit: "rpm",
          value: 85,
        },
      });
    });
  });
});

describe("KRD to Zwift target converters", () => {
  describe("convertKrdPowerToZwift", () => {
    it("should convert KRD percent_ftp to Zwift FTP percentage", () => {
      // Arrange
      const percentFtp = 85;

      // Act
      const result = convertKrdPowerToZwift(percentFtp);

      // Assert
      expect(result).toBe(0.85);
    });

    it("should handle low power", () => {
      // Arrange
      const percentFtp = 50;

      // Act
      const result = convertKrdPowerToZwift(percentFtp);

      // Assert
      expect(result).toBe(0.5);
    });

    it("should handle high power", () => {
      // Arrange
      const percentFtp = 150;

      // Act
      const result = convertKrdPowerToZwift(percentFtp);

      // Assert
      expect(result).toBe(1.5);
    });

    it("should handle maximum power", () => {
      // Arrange
      const percentFtp = 300;

      // Act
      const result = convertKrdPowerToZwift(percentFtp);

      // Assert
      expect(result).toBe(3.0);
    });
  });

  describe("convertKrdPowerRangeToZwift", () => {
    it("should convert KRD power range to Zwift PowerLow/PowerHigh", () => {
      // Arrange
      const min = 60;
      const max = 80;

      // Act
      const result = convertKrdPowerRangeToZwift(min, max);

      // Assert
      expect(result).toStrictEqual([0.6, 0.8]);
    });

    it("should handle warmup range", () => {
      // Arrange
      const min = 50;
      const max = 75;

      // Act
      const result = convertKrdPowerRangeToZwift(min, max);

      // Assert
      expect(result).toStrictEqual([0.5, 0.75]);
    });

    it("should handle cooldown range", () => {
      // Arrange
      const min = 75;
      const max = 50;

      // Act
      const result = convertKrdPowerRangeToZwift(min, max);

      // Assert
      expect(result).toStrictEqual([0.75, 0.5]);
    });
  });

  describe("convertKrdPaceToZwift", () => {
    it("should convert KRD meters per second to Zwift seconds per kilometer", () => {
      // Arrange
      const metersPerSecond = 3.3333333333333335;

      // Act
      const result = convertKrdPaceToZwift(metersPerSecond);

      // Assert
      expect(result).toBeCloseTo(300, 1);
    });

    it("should handle fast pace", () => {
      // Arrange
      const metersPerSecond = 4.166666666666667;

      // Act
      const result = convertKrdPaceToZwift(metersPerSecond);

      // Assert
      expect(result).toBeCloseTo(240, 1);
    });

    it("should handle slow pace", () => {
      // Arrange
      const metersPerSecond = 2.7777777777777777;

      // Act
      const result = convertKrdPaceToZwift(metersPerSecond);

      // Assert
      expect(result).toBeCloseTo(360, 1);
    });
  });

  describe("convertKrdCadenceToZwift", () => {
    it("should convert KRD cadence for cycling", () => {
      // Arrange
      const rpm = 90;
      const isRunning = false;

      // Act
      const result = convertKrdCadenceToZwift(rpm, isRunning);

      // Assert
      expect(result).toBe(90);
    });

    it("should convert KRD cadence for running with rpm to spm conversion", () => {
      // Arrange
      const rpm = 90;
      const isRunning = true;

      // Act
      const result = convertKrdCadenceToZwift(rpm, isRunning);

      // Assert
      expect(result).toBe(180);
    });

    it("should handle low cycling cadence", () => {
      // Arrange
      const rpm = 60;

      // Act
      const result = convertKrdCadenceToZwift(rpm);

      // Assert
      expect(result).toBe(60);
    });

    it("should handle high cycling cadence", () => {
      // Arrange
      const rpm = 120;

      // Act
      const result = convertKrdCadenceToZwift(rpm);

      // Assert
      expect(result).toBe(120);
    });

    it("should handle running cadence with default isRunning false", () => {
      // Arrange
      const rpm = 85;

      // Act
      const result = convertKrdCadenceToZwift(rpm);

      // Assert
      expect(result).toBe(85);
    });
  });
});
