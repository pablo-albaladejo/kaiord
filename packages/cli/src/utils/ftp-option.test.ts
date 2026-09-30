import { describe, expect, it } from "vitest";

import { coerceFtp } from "./ftp-option";

const FTP_INVALID = "--ftp must be a positive number of watts";
const FTP_W = 250;
const NEGATIVE_W = -5;

describe("coerceFtp", () => {
  it("should keep a positive FTP in watts", () => {
    // Arrange
    const value = FTP_W;

    // Act
    const watts = coerceFtp(value);

    // Assert
    expect(watts).toBe(FTP_W);
  });

  it("should leave an omitted --ftp undefined", () => {
    // Arrange
    const value = undefined;

    // Act
    const watts = coerceFtp(value);

    // Assert
    expect(watts).toBeUndefined();
  });

  it.each([0, NEGATIVE_W, Number.NaN, Number.POSITIVE_INFINITY, "abc"])(
    "should reject %s with a clear --ftp message",
    (value) => {
      // Arrange
      const coerce = () => coerceFtp(value);

      // Act
      const run = coerce;

      // Assert
      expect(run).toThrow(FTP_INVALID);
    }
  );
});
