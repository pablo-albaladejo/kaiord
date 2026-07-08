import { findParityViolations } from "@kaiord/i18n";
import { describe, expect, it } from "vitest";

import { resources } from "./resources";

describe("SPA i18n resource parity", () => {
  it("should keep en and es catalogs at key parity across every namespace", () => {
    // Arrange
    const { en, es } = resources;

    // Act
    const violations = findParityViolations(en, es);

    // Assert
    expect(violations).toEqual([]);
  });
});
