import { describe, expect, it } from "vitest";

import type { FitTargetData } from "./target.types";
import { convertStrokeTypeTarget } from "./target-stroke.converter";

describe("convertStrokeTypeTarget", () => {
  describe("stroke type target", () => {
    it("should return stroke_type target for freestyle (0)", () => {
      // Arrange
      const data: FitTargetData = {
        targetSwimStroke: 0,
      };

      // Act
      const result = convertStrokeTypeTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 0 },
      });
    });

    it("should return stroke_type target for backstroke (1)", () => {
      // Arrange
      const data: FitTargetData = {
        targetSwimStroke: 1,
      };

      // Act
      const result = convertStrokeTypeTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 1 },
      });
    });

    it("should return stroke_type target for breaststroke (2)", () => {
      // Arrange
      const data: FitTargetData = {
        targetSwimStroke: 2,
      };

      // Act
      const result = convertStrokeTypeTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 2 },
      });
    });

    it("should return stroke_type target for butterfly (3)", () => {
      // Arrange
      const data: FitTargetData = {
        targetSwimStroke: 3,
      };

      // Act
      const result = convertStrokeTypeTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 3 },
      });
    });

    it("should return stroke_type target for drill (4)", () => {
      // Arrange
      const data: FitTargetData = {
        targetSwimStroke: 4,
      };

      // Act
      const result = convertStrokeTypeTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 4 },
      });
    });

    it("should return stroke_type target for mixed/IM (5)", () => {
      // Arrange
      const data: FitTargetData = {
        targetSwimStroke: 5,
      };

      // Act
      const result = convertStrokeTypeTarget(data);

      // Assert
      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 5 },
      });
    });
  });

  describe("open target fallback", () => {
    it("should return open target when targetSwimStroke is undefined", () => {
      // Arrange
      const data: FitTargetData = {};

      // Act
      const result = convertStrokeTypeTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
