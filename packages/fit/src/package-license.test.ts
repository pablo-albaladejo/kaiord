import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

const readJson = (path: string) =>
  JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;

const OWN = readJson(join(import.meta.dirname, "../package.json"));
const SDK_DIR = dirname(require.resolve("@garmin/fitsdk/package.json"));

describe("@kaiord/fit's license and Garmin's", () => {
  it("should declare its own code MIT and depend on Garmin's FIT SDK", () => {
    // Arrange
    const dependencies = OWN.dependencies as Record<string, string>;

    // Act
    const license = OWN.license;

    // Assert
    expect(license).toBe("MIT");
    expect(Object.keys(dependencies)).toContain("@garmin/fitsdk");
  });

  it("should find Garmin's FIT SDK licensed under the FIT Protocol License Agreement, not MIT", () => {
    // Arrange
    const sdk = readJson(join(SDK_DIR, "package.json"));

    // Act
    const agreement = readFileSync(join(SDK_DIR, "LICENSE.txt"), "utf8")
      .split(/\s+/)
      .join(" ");

    // Assert
    expect(sdk.author).toBe("Garmin International, Inc.");
    expect(sdk.license).toBe("SEE LICENSE IN LICENSE.txt");
    expect(agreement).toMatch(
      /^This Flexible and Interoperable Data Transfer \(FIT\) Protocol License Agreement/
    );
    expect(agreement).toContain(
      "BY USING THE LICENSED TECHNOLOGY, YOU SIGNIFY YOUR AGREEMENT TO THESE TERMS"
    );
  });
});
