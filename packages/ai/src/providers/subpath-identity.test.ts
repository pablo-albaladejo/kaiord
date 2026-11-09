/**
 * Guards module identity across subpath entries. tsdown (rolldown) always
 * code-splits within a single build: an internal module shared by `./` and
 * `./providers` is hoisted into a common chunk both entries import, so a
 * singleton created in one subpath is the same instance seen in the other.
 * Identity would regress if the entries were split into separate builds
 * (a `defineConfig([...])` array), where each build inlines its own copy of
 * shared modules. This test imports the actual config object and fails the
 * moment it regresses to that shape.
 */
import { describe, expect, it } from "vitest";

import aiBuildConfig from "../../tsdown.config";
import { MODEL_CATALOG, PROVIDER_MODELS } from "./index";

const SUBPATH_ENTRIES = [
  "src/index.ts",
  "src/providers/index.ts",
  "src/prompts/index.ts",
  "src/agents/index.ts",
  "src/observability/index.ts",
];

describe("subpath module identity", () => {
  it("should build all subpath entries in one config so shared modules stay singletons", () => {
    // Arrange
    const config = aiBuildConfig;

    // Act
    const isSingleBuild = !Array.isArray(config);
    const entryValues =
      isSingleBuild && typeof config.entry === "object" && config.entry !== null
        ? Object.values(config.entry)
        : [];

    // Assert
    expect(isSingleBuild).toBe(true);
    expect(entryValues).toEqual(expect.arrayContaining(SUBPATH_ENTRIES));
  });

  it("should keep the legacy PROVIDER_MODELS export as an alias of the catalog", () => {
    // Arrange

    // Act
    const alias = PROVIDER_MODELS;

    // Assert
    expect(alias).toBe(MODEL_CATALOG);
  });
});
