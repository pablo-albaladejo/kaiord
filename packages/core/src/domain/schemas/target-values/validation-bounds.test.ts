import { describe, expect, it } from "vitest";

import { workoutSchema } from "../workout";
import { cadenceValueSchema } from "./cadence";
import { heartRateValueSchema } from "./heart-rate";
import { paceValueSchema } from "./pace";
import { powerValueSchema } from "./power";

describe("powerValueSchema bounds", () => {
  it("should accept a zero-watt target", () => {
    // Arrange
    const input = { unit: "watts", value: 0 };

    // Act
    const result = powerValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject watts above 5000", () => {
    // Arrange
    const input = { unit: "watts", value: 6000 };

    // Act
    const result = powerValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject percent FTP above 1000", () => {
    // Arrange
    const input = { unit: "percent_ftp", value: 1500 };

    // Act
    const result = powerValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an inverted power range", () => {
    // Arrange
    const input = { unit: "range", min: 300, max: 200 };

    // Act
    const result = powerValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should accept a valid power range", () => {
    // Arrange
    const input = { unit: "range", min: 200, max: 300 };

    // Act
    const result = powerValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe("heartRateValueSchema bounds", () => {
  it("should accept a typical bpm target", () => {
    // Arrange
    const input = { unit: "bpm", value: 145 };

    // Act
    const result = heartRateValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject bpm above 300", () => {
    // Arrange
    const input = { unit: "bpm", value: 350 };

    // Act
    const result = heartRateValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject percent max above 100", () => {
    // Arrange
    const input = { unit: "percent_max", value: 150 };

    // Act
    const result = heartRateValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an inverted heart rate range", () => {
    // Arrange
    const input = { unit: "range", min: 180, max: 120 };

    // Act
    const result = heartRateValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should accept an equal-bounds heart rate range", () => {
    // Arrange
    const input = { unit: "range", min: 150, max: 150 };

    // Act
    const result = heartRateValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe("paceValueSchema bounds", () => {
  it("should accept a typical running pace", () => {
    // Arrange
    const input = { unit: "mps", value: 3.5 };

    // Act
    const result = paceValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject speeds above 30 meters per second", () => {
    // Arrange
    const input = { unit: "mps", value: 50 };

    // Act
    const result = paceValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an inverted pace range", () => {
    // Arrange
    const input = { unit: "range", min: 4.2, max: 3.1 };

    // Act
    const result = paceValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("cadenceValueSchema bounds", () => {
  it("should accept a typical cycling cadence", () => {
    // Arrange
    const input = { unit: "rpm", value: 90 };

    // Act
    const result = cadenceValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject cadence above 300 rpm", () => {
    // Arrange
    const input = { unit: "rpm", value: 400 };

    // Act
    const result = cadenceValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an inverted cadence range", () => {
    // Arrange
    const input = { unit: "range", min: 95, max: 85 };

    // Act
    const result = cadenceValueSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("workoutSchema pool length bounds", () => {
  it("should accept a standard 25 meter pool", () => {
    // Arrange
    const input = { sport: "swimming", steps: [], poolLength: 25 };

    // Act
    const result = workoutSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a sub-meter pool length", () => {
    // Arrange
    const input = { sport: "swimming", steps: [], poolLength: 0.5 };

    // Act
    const result = workoutSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an absurdly long pool", () => {
    // Arrange
    const input = { sport: "swimming", steps: [], poolLength: 99999 };

    // Act
    const result = workoutSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
