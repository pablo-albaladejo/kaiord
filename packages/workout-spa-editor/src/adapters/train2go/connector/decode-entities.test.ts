import { describe, expect, it } from "vitest";

import { decodeEntities } from "./decode-entities";

describe("decodeEntities", () => {
  it("should decode numeric entities", () => {
    // Arrange
    const input = "15&#039; Z5";

    // Act
    const result = decodeEntities(input);

    // Assert
    expect(result).toBe("15' Z5");
  });

  it("should decode hex entities", () => {
    // Arrange
    const input = "alg&#xFA;n";

    // Act
    const result = decodeEntities(input);

    // Assert
    expect(result).toBe("algún");
  });

  it("should decode named entities", () => {
    // Arrange
    const input = "A &amp; B &lt; C";

    // Act
    const result = decodeEntities(input);

    // Assert
    expect(result).toBe("A & B < C");
  });
});
