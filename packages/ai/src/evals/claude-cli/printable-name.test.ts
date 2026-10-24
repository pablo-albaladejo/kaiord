import { describe, expect, it } from "vitest";

import { MAX_PRINTED_NAME, printable } from "./printable-name";

describe("printable", () => {
  it("should return a short plain name unchanged", () => {
    // Arrange
    const name = "cc-plugin@builtin";

    // Act
    const result = printable(name);

    // Assert
    expect(result).toBe(name);
  });

  it("should drop a non-string, an over-long or a non-plain name", () => {
    // Arrange
    const names = [null,"x".repeat(MAX_PRINTED_NAME + 1), "has space"];

    // Act
    const results = names.map(printable);

    // Assert
    expect(results).toEqual([undefined, undefined, undefined]);
  });
});
