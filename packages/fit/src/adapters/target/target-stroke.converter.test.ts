import { describe, expect, it } from "vitest";
import { convertStrokeTypeTarget } from "./target-stroke.converter";
import type { FitTargetData } from "./target.types";

describe("convertStrokeTypeTarget", () => {
  describe("stroke type target", () => {
    it("should return stroke_type target for freestyle (0)", () => {
      const data: FitTargetData = {
        targetSwimStroke: 0,
      };

      const result = convertStrokeTypeTarget(data);

      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 0 },
      });
    });

    it("should return stroke_type target for backstroke (1)", () => {
      const data: FitTargetData = {
        targetSwimStroke: 1,
      };

      const result = convertStrokeTypeTarget(data);

      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 1 },
      });
    });

    it("should return stroke_type target for breaststroke (2)", () => {
      const data: FitTargetData = {
        targetSwimStroke: 2,
      };

      const result = convertStrokeTypeTarget(data);

      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 2 },
      });
    });

    it("should return stroke_type target for butterfly (3)", () => {
      const data: FitTargetData = {
        targetSwimStroke: 3,
      };

      const result = convertStrokeTypeTarget(data);

      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 3 },
      });
    });

    it("should return stroke_type target for drill (4)", () => {
      const data: FitTargetData = {
        targetSwimStroke: 4,
      };

      const result = convertStrokeTypeTarget(data);

      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 4 },
      });
    });

    it("should return stroke_type target for mixed/IM (5)", () => {
      const data: FitTargetData = {
        targetSwimStroke: 5,
      };

      const result = convertStrokeTypeTarget(data);

      expect(result).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 5 },
      });
    });
  });

  describe("open target fallback", () => {
    it("should return open target when targetSwimStroke is undefined", () => {
      const data: FitTargetData = {};

      const result = convertStrokeTypeTarget(data);

      expect(result).toStrictEqual({ type: "open" });
    });
  });
});
