import { describe, expect, it } from "vitest";

import enStrings from "../i18n/en-strings.json";
import esStrings from "../i18n/es.json";

const es: Record<string, string> = esStrings;

describe("landing i18n resource parity", () => {
  it("should provide a non-empty es translation for every en string", () => {
    // Arrange
    const inventory = enStrings;

    // Act
    const missing = inventory.filter(
      (key) => typeof es[key] !== "string" || es[key].trim() === ""
    );

    // Assert
    expect(missing).toEqual([]);
  });

  it("should not carry es keys that are absent from the en inventory", () => {
    // Arrange
    const inventory = new Set(enStrings);

    // Act
    const orphans = Object.keys(es).filter((key) => !inventory.has(key));

    // Assert
    expect(orphans).toEqual([]);
  });
});
