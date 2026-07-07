import { describe, expect, it } from "vitest";

import { stampProvenance } from "./stamp-provenance";

describe("stampProvenance", () => {
  it("should build a provenance object with sourceBridgeId and externalId", () => {
    // Arrange
    const sourceBridgeId = "fit-import";
    const externalId = "k1:abc123";

    // Act
    const result = stampProvenance(sourceBridgeId, externalId);

    // Assert
    expect(result).toEqual({ sourceBridgeId, externalId });
  });

  it("should produce the identical key shape regardless of call site", () => {
    // Arrange

    // Act
    const fitProvenance = stampProvenance("fit-import", "hash-a");
    const manualProvenance = stampProvenance("manual", "hash-b");

    // Assert
    expect(Object.keys(fitProvenance).sort()).toEqual(
      Object.keys(manualProvenance).sort()
    );
    expect(Object.keys(fitProvenance).sort()).toEqual([
      "externalId",
      "sourceBridgeId",
    ]);
  });
});
