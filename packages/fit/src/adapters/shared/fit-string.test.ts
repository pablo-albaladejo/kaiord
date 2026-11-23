import { describe, expect, it } from "vitest";

import {
  FIT_STRING_MAX_BYTES,
  fitStringBytes,
  fitStringPrefix,
} from "./fit-string";

const TWO_BYTE_CHARACTERS = 200;

describe("fitStringPrefix", () => {
  it("should keep a text that fits and cut a longer one on a character boundary", () => {
    // Arrange
    const short = "Spin easy";
    const long = "é".repeat(TWO_BYTE_CHARACTERS);

    // Act
    const kept = fitStringPrefix(short);
    const cut = fitStringPrefix(long);

    // Assert
    expect(kept).toBe(short);
    expect(cut).toBe("é".repeat(FIT_STRING_MAX_BYTES / 2));
    expect(fitStringBytes(cut)).toBe(FIT_STRING_MAX_BYTES);
  });
});
