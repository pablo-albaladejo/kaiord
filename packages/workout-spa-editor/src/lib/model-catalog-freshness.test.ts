/**
 * Freshness guard: the committed model catalog MUST equal a regeneration from
 * the pinned `@ai-sdk/*` packages. Fails CI when the SDK is bumped without
 * running `pnpm generate:model-catalog`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  extractCatalog,
  renderCatalogModule,
} from "../../scripts/model-catalog-extract.mjs";

const here = dirname(fileURLToPath(import.meta.url));

describe("model catalog freshness", () => {
  it("should match the committed catalog regenerated from the pinned SDK", () => {
    // Arrange
    const committed = readFileSync(
      join(here, "generated", "model-catalog.ts"),
      "utf8"
    );

    // Act
    const regenerated = renderCatalogModule(extractCatalog());

    // Assert
    expect(regenerated).toBe(committed);
  });
});
