import { describe, expect, it } from "vitest";

import type { FitTargetData } from "./target.types";
import { convertStrokeTypeTarget } from "./target-stroke.converter";

describe("convertStrokeTypeTarget", () => {
  describe("stroke type target", () => {
    it.each([
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5 },
    ])(
      "should return stroke_type target for swim stroke $value",
      ({ value }) => {
        // Arrange
        const data: FitTargetData = {
          targetStrokeType: value,
        };

        // Act
        const result = convertStrokeTypeTarget(data);

        // Assert
        expect(result).toStrictEqual({
          type: "stroke_type",
          value: { unit: "swim_stroke", value },
        });
      }
    );
  });

  describe("open target fallback", () => {
    it("should return open target when targetStrokeType is undefined", () => {
      // Arrange
      const data: FitTargetData = {};

      // Act
      const result = convertStrokeTypeTarget(data);

      // Assert
      expect(result).toStrictEqual({ type: "open" });
    });
  });

  describe("decoder enum names", () => {
    it.each([
      { name: "freestyle", value: 0 },
      { name: "breaststroke", value: 2 },
      { name: "mixed", value: 5 },
    ])(
      "should map the decoded stroke name $name to $value",
      ({ name, value }) => {
        // Arrange
        const data: FitTargetData = { targetStrokeType: name };

        // Act
        const result = convertStrokeTypeTarget(data);

        // Assert
        expect(result).toStrictEqual({
          type: "stroke_type",
          value: { unit: "swim_stroke", value },
        });
      }
    );

    it.each(["doggy_paddle", "im"])(
      "should return open target for stroke %s, outside the KRD stroke codes",
      (name) => {
        // Arrange
        const data: FitTargetData = { targetStrokeType: name };

        // Act
        const result = convertStrokeTypeTarget(data);

        // Assert
        expect(result).toStrictEqual({ type: "open" });
      }
    );
  });
});
