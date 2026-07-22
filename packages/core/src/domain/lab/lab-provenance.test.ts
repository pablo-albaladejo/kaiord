import { describe, expect, it } from "vitest";

import { labProvenanceSchema } from "./lab-provenance";

describe("labProvenanceSchema", () => {
  it("should accept the manual source", () => {
    // Arrange
    const input = { source: "manual" };

    // Act
    const result = labProvenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept the ai-extracted source", () => {
    // Arrange
    const input = { source: "ai-extracted" };

    // Act
    const result = labProvenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept the whoop source", () => {
    // Arrange
    const input = { source: "whoop" };

    // Act
    const result = labProvenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept optional sourceBridgeId and externalId alongside the whoop source", () => {
    // Arrange
    const input = {
      source: "whoop",
      sourceBridgeId: "whoop-bridge",
      externalId: "test-1:alt",
    };

    // Act
    const result = labProvenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject an out-of-enum source", () => {
    // Arrange
    const input = { source: "imported" };

    // Act
    const result = labProvenanceSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
