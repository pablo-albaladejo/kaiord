import { describe, expect, it } from "vitest";

import { parseLiveArgs } from "./live-args";

const FIVE = 5;

describe("parseLiveArgs", () => {
  it("should default to one measured pass", () => {
    // Arrange
    const argv: Array<string> = [];

    // Act
    const args = parseLiveArgs(argv);

    // Assert
    expect(args).toEqual({ repeat: 1, record: false, calibrate: false });
  });

  it("should read --repeat N and ignore the literal -- pnpm passes", () => {
    // Arrange
    const argv = ["--", "--repeat", "5"];

    // Act
    const args = parseLiveArgs(argv);

    // Assert
    expect(args.repeat).toBe(FIVE);
  });

  it("should read --record and --calibrate", () => {
    // Arrange
    const record = ["--record"];
    const calibrate = ["--calibrate"];

    // Act
    const parsed = [parseLiveArgs(record), parseLiveArgs(calibrate)];

    // Assert
    expect(parsed[0]?.record).toBe(true);
    expect(parsed[1]?.calibrate).toBe(true);
  });

  it("should refuse a bad count, an unknown flag and conflicting modes", () => {
    // Arrange
    const bad = [
      ["--repeat", "0"],
      ["--repeat"],
      ["--model", "x"],
      ["--record", "--repeat", "2"],
      ["--calibrate", "--record"],
    ];

    // Act
    const thrown = bad.map((argv) => {
      try {
        parseLiveArgs(argv);
        return "parsed";
      } catch {
        return "refused";
      }
    });

    // Assert
    expect(thrown).toEqual(Array(bad.length).fill("refused"));
  });
});
