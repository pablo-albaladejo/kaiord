import { durationTypeSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { convertOriginalZwiftDuration } from "./original-duration.converter";

describe("convertOriginalZwiftDuration", () => {
  describe("original duration type restoration", () => {
    it("should restore distance duration from kaiord extension", () => {
      // Arrange
      const data = {
        Duration: 1000,
        "kaiord:originalDurationType": "distance",
        "kaiord:originalDurationMeters": 2000,
      };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: durationTypeSchema.enum.distance,
        meters: 2000,
      });
    });

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

    it("should restore heart_rate_less_than duration from kaiord extension", () => {
      // Arrange
      const data = {
        Duration: 300,
        "kaiord:originalDurationType": "heart_rate_less_than",
        "kaiord:originalDurationBpm": 140,
      };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: durationTypeSchema.enum.heart_rate_less_than,
        bpm: 140,
      });
    });

    it("should restore power_less_than duration from kaiord extension", () => {
      // Arrange
      const data = {
        Duration: 300,
        "kaiord:originalDurationType": "power_less_than",
        "kaiord:originalDurationWatts": 200,
      };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({
        type: durationTypeSchema.enum.power_less_than,
        watts: 200,
      });
    });

    it("should restore a distance duration with no recoverable value as zero meters", () => {
      // Arrange
      const data = { "kaiord:originalDurationType": "distance" };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: "distance", meters: 0 });
    });

    it("should restore a heart-rate duration with no bpm as zero", () => {
      // Arrange
      const data = { "kaiord:originalDurationType": "heart_rate_less_than" };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: "heart_rate_less_than", bpm: 0 });
    });

    it("should restore a power duration with no watts as zero", () => {
      // Arrange
      const data = { "kaiord:originalDurationType": "power_less_than" };

      // Act
      const result = convertOriginalZwiftDuration(data);

      // Assert
      expect(result).toStrictEqual({ type: "power_less_than", watts: 0 });
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
