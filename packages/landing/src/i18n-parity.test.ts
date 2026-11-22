import { describe, expect, it } from "vitest";

import enStrings from "../i18n/en-strings.json";
import esStrings from "../i18n/es.json";
import indexHtml from "../index.html?raw";
import { expandIncludes } from "../scripts/expand-includes.mjs";
import { extractInventory } from "../scripts/extract-strings.mjs";

// vitest serves files as /@fs/<abs path>; the helper needs the real directory.
const landingRoot = decodeURIComponent(
  new URL("..", import.meta.url).pathname
).replace(/^\/@fs/, "");

const es: Record<string, string> = esStrings;

describe("landing i18n resource parity", () => {
  it("should hold in the en inventory exactly the copy index.html shows", () => {
    // Arrange
    const html = expandIncludes(indexHtml, landingRoot);

    // Act
    const inventory = extractInventory(html);

    // Assert
    expect(enStrings).toEqual(inventory);
  });

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
