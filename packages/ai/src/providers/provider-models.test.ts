import { describe, expect, it } from "vitest";

import {
  getDefaultModel,
  isRetiredModel,
  MODEL_CATALOG,
  RETIRED_MODELS,
  usableModel,
} from "./provider-models";
import type { LlmProviderType } from "./types";

const TYPES: LlmProviderType[] = ["anthropic", "openai", "google"];

describe("getDefaultModel", () => {
  it.each(TYPES)(
    "should default %s to a catalog model the provider still serves",
    (type) => {
      // Arrange
      const catalogIds = MODEL_CATALOG[type].map((m) => m.id);

      // Act
      const model = getDefaultModel(type);

      // Assert
      expect(catalogIds).toContain(model);
      expect(isRetiredModel(type, model)).toBe(false);
    }
  );

  it("should not default anthropic to the oldest catalog entry", () => {
    // Arrange
    const oldest = MODEL_CATALOG.anthropic[0]?.id;

    // Act
    const model = getDefaultModel("anthropic");

    // Assert
    expect(model).not.toBe(oldest);
    expect(model).toBe("claude-sonnet-4-5");
  });
});

describe("retired models", () => {
  it("should never offer a retired model in the catalog", () => {
    // Arrange
    const offered = TYPES.flatMap((type) =>
      MODEL_CATALOG[type]
        .map((m) => m.id)
        .filter((id) => RETIRED_MODELS[type].includes(id))
    );

    // Act
    const leaked = offered;

    // Assert
    expect(leaked).toEqual([]);
  });

  it("should list claude-3-haiku-20240307 as retired", () => {
    // Arrange
    const id = "claude-3-haiku-20240307";

    // Act
    const retired = isRetiredModel("anthropic", id);

    // Assert
    expect(retired).toBe(true);
  });

  it("should replace a retired model with the type default", () => {
    // Arrange
    const id = "claude-3-haiku-20240307";

    // Act
    const model = usableModel("anthropic", id);

    // Assert
    expect(model).toBe(getDefaultModel("anthropic"));
  });

  it("should keep a model the provider still serves, even if uncatalogued", () => {
    // Arrange
    const id = "claude-custom-preview";

    // Act
    const model = usableModel("anthropic", id);

    // Assert
    expect(model).toBe(id);
  });
});
