import { durationTypeSchema } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import { convertOriginalZwiftDuration } from "./original-duration.converter";

describe("convertOriginalZwiftDuration", () => {
  describe("original duration type restoration", () => {
    it.each([
      {
        data: {
          Duration: 1000,
          "kaiord:originalDurationType": "distance",
          "kaiord:originalDurationMeters": 2000,
        },
        expected: { type: durationTypeSchema.enum.distance, meters: 2000 },
      },
      {
        data: {
          Duration: 300,
          "kaiord:originalDurationType": "heart_rate_less_than",
          "kaiord:originalDurationBpm": 140,
        },
        expected: {
          type: durationTypeSchema.enum.heart_rate_less_than,
          bpm: 140,
        },
      },
      {
        data: {
          Duration: 300,
          "kaiord:originalDurationType": "power_less_than",
          "kaiord:originalDurationWatts": 200,
        },
        expected: { type: durationTypeSchema.enum.power_less_than, watts: 200 },
      },
    ])(
      "should restore $expected.type duration from kaiord extension",
      ({ data, expected }) => {
        // Arrange

        // Act
        const result = convertOriginalZwiftDuration(data);

        // Assert
        expect(result).toStrictEqual(expected);
      }
    );

    it("should fall back to Duration when originalDurationMeters is absent", () => {
      // Arrange
      const data = {
        Duration: 1500,
        "kaiord:originalDurationType": "distance",
      };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: durationTypeSchema.enum.distance,
        meters: 1500,
      });
    });

    it.each([
      { originalDurationType: "distance", attribute: "originalDurationMeters" },
      {
        originalDurationType: "heart_rate_less_than",
        attribute: "originalDurationBpm",
      },
      {
        originalDurationType: "power_less_than",
        attribute: "originalDurationWatts",
      },
    ])(
      "should restore open and warn when $originalDurationType value is missing",
      ({ originalDurationType, attribute }) => {
        // Arrange
        const data = { "kaiord:originalDurationType": originalDurationType };
        const logger = createMockLogger();
        const warnSpy = vi.spyOn(logger, "warn");

        // Act
        const result = convertOriginalZwiftDuration(data, logger);

        // Assert
        expect(result).toStrictEqual({ type: durationTypeSchema.enum.open });
        expect(warnSpy).toHaveBeenCalledWith(
          "Lossy conversion: corrupted round-trip duration restored as open",
          expect.objectContaining({ originalDurationType, attribute })
        );
      }
    );

    it("should restore open without a logger when bpm is missing", () => {
      // Arrange
      const data = { "kaiord:originalDurationType": "heart_rate_less_than" };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: durationTypeSchema.enum.open });
    });
  });

  describe("standard duration fallback", () => {
    it("should return open duration when Duration is undefined", () => {
      // Arrange
      const data = {};

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: durationTypeSchema.enum.open });
    });

    it("should return open duration when Duration is zero", () => {
      // Arrange
      const data = { Duration: 0 };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: durationTypeSchema.enum.open });
    });

    it("should return open duration when Duration is negative", () => {
      // Arrange
      const data = { Duration: -1 };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: durationTypeSchema.enum.open });
    });

    it("should return distance duration when durationType is distance", () => {
      // Arrange
      const data = { Duration: 5000, durationType: "distance" as const };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: durationTypeSchema.enum.distance,
        meters: 5000,
      });
    });

    it("should return time duration for positive Duration without extension", () => {
      // Arrange
      const data = { Duration: 300, durationType: "time" as const };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: durationTypeSchema.enum.time,
        seconds: 300,
      });
    });
  });
});
