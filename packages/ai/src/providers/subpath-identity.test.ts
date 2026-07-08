/**
 * Guards module identity across subpath entries. tsup emits one bundle per
 * entry; with code-splitting OFF, an internal module shared by `./` and
 * `./providers` would be inlined into each, so a singleton created in one
 * subpath would not be the same instance seen in the other. `splitting: true`
 * hoists shared modules into a common chunk both entries import. This test
 * fails the moment that setting regresses, and asserts the providers barrel
 * does not duplicate the catalog module through divergent import paths.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { MODEL_CATALOG, PROVIDER_MODELS } from "./index";
import { MODEL_CATALOG as DIRECT_CATALOG } from "./provider-models";

const here = dirname(fileURLToPath(import.meta.url));

describe("subpath module identity", () => {
  it("should keep code-splitting enabled so shared modules stay singletons", () => {
    // Arrange
    const config = readFileSync(
      join(here, "..", "..", "tsup.config.ts"),
      "utf8"
    );

    // Act
    const hasSplitting = /splitting:\s*true/.test(config);

    // Assert
    expect(hasSplitting).toBe(true);
  });

  it("should resolve the catalog to a single module instance through the barrel", () => {
    // Arrange

    // Act
    const viaBarrel = MODEL_CATALOG;

    // Assert
    expect(viaBarrel).toBe(DIRECT_CATALOG);
    expect(PROVIDER_MODELS).toBe(DIRECT_CATALOG);
  });
});
