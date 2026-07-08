import { describe, expect, it } from "vitest";
import type { ZodIssue } from "zod";

import { powerValueSchema } from "../schemas/target-values/power";
import { mapZodErrors } from "./map-zod-errors";

describe("mapZodErrors code derivation", () => {
  it("should prefer an explicit params.code over the native issue code", () => {
    // Arrange
    const issues = [
      {
        code: "custom",
        message: "min must be less than or equal to max",
        path: ["min"],
        params: { code: "min_gt_max" },
      },
    ] as unknown as ZodIssue[];

    // Act
    const errors = mapZodErrors(issues);

    // Assert
    expect(errors[0]).toEqual({
      field: "min",
      message: "min must be less than or equal to max",
      code: "min_gt_max",
    });
  });

  it("should fall back to the native Zod issue code when no params.code is present", () => {
    // Arrange
    const issues = [
      { code: "invalid_type", message: "Invalid input", path: ["min"] },
    ] as unknown as ZodIssue[];

    // Act
    const errors = mapZodErrors(issues);

    // Assert
    expect(errors[0]?.code).toBe("invalid_type");
  });

  it("should surface min_gt_max from an inverted power range end to end", () => {
    // Arrange
    const result = powerValueSchema.safeParse({
      unit: "range",
      min: 200,
      max: 150,
    });

    // Act
    const errors = result.success ? [] : mapZodErrors(result.error.issues);

    // Assert
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "min", code: "min_gt_max" })
    );
  });

  it("should keep the code stable when the message wording changes", () => {
    // Arrange
    const reworded = [
      {
        code: "custom",
        message: "the minimum cannot exceed the maximum",
        path: ["min"],
        params: { code: "min_gt_max" },
      },
    ] as unknown as ZodIssue[];

    // Act
    const errors = mapZodErrors(reworded);

    // Assert
    expect(errors[0]?.code).toBe("min_gt_max");
  });
});
