import { describe, expect, it } from "vitest";

import { checkManifest } from "./manifest";

const SHA256_HEX_LENGTH = 64;

const DIGEST = "a".repeat(SHA256_HEX_LENGTH);

describe("checkManifest fault ids", () => {
  it("should quote an id carrying a replacement pattern verbatim", () => {
    // Arrange
    const manifest = {
      cassettes: [{ id: "case-$&-x", sha256: DIGEST }],
    };

    // Act
    const { faults } = checkManifest(manifest, []);

    // Assert
    expect(faults[0]).toContain("missing cassettes: case-$&-x");
  });
});
