import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { findPackageVersion } from "./find-package-version";

const PACKAGE_DIR = join(__dirname, "../..");

describe("findPackageVersion", () => {
  it("should find this package's version from a nested directory", () => {
    // Arrange
    const expected = JSON.parse(
      readFileSync(join(PACKAGE_DIR, "package.json"), "utf-8")
    ).version;

    // Act
    const version = findPackageVersion(join(PACKAGE_DIR, "dist", "bin"));

    // Assert
    expect(version).toBe(expected);
  });

  it("should fall back to 0.0.0 when no manifest of this package is found", () => {
    // Arrange
    const root = "/";

    // Act
    const version = findPackageVersion(root);

    // Assert
    expect(version).toBe("0.0.0");
  });
});
