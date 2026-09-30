import { describe, expect, it } from "vitest";

import {
  DEPRECATED_MODELS,
  deprecationOf,
  getDefaultModel,
  isRetiredModel,
  MODEL_CATALOG,
  modelForProvider,
  PREFERRED_DEFAULT_MODELS,
  RETIRED_MODELS,
  retiredSuccessor,
  usableModel,
} from "./provider-models";
import type { LlmProviderType } from "./types";

const TYPES: LlmProviderType[] = ["anthropic", "openai", "google"];

const catalogIds = (type: LlmProviderType) =>
  MODEL_CATALOG[type].map((m) => m.id);

describe("getDefaultModel", () => {
  it.each(TYPES)(
    "should pin the curated %s default to a served catalog model",
    (type) => {
      // Arrange
      const preferred = PREFERRED_DEFAULT_MODELS[type];

      // Act
      const model = getDefaultModel(type);

      // Assert
      expect(model).toBe(preferred);
      expect(catalogIds(type)).toContain(preferred);
      expect(isRetiredModel(type, model)).toBe(false);
      expect(deprecationOf(type, model)).toBeUndefined();
    }
  );

  it("should default anthropic to claude-sonnet-5", () => {
    // Arrange
    const type: LlmProviderType = "anthropic";

    // Act
    const model = getDefaultModel(type);

    // Assert
    expect(model).toBe("claude-sonnet-5");
  });
});

describe("retired models", () => {
  it.each(TYPES)(
    "should never offer a retired %s model and map each to a catalog successor",
    (type) => {
      // Arrange
      const retired = Object.entries(RETIRED_MODELS[type]);

      // Act
      const leaked = retired.filter(([id]) => catalogIds(type).includes(id));
      const orphaned = retired.filter(([, s]) => !catalogIds(type).includes(s));

      // Assert
      expect(leaked).toEqual([]);
      expect(orphaned).toEqual([]);
    }
  );

  it.each([
    { id: "claude-3-haiku-20240307", successor: "claude-haiku-4-5" },
    { id: "claude-opus-4-1", successor: "claude-opus-5" },
    { id: "claude-opus-4-1-20250805", successor: "claude-opus-5" },
  ])("should heal $id to its same-tier successor", ({ id, successor }) => {
    // Arrange
    const type: LlmProviderType = "anthropic";

    // Act
    const model = usableModel(type, id);

    // Assert
    expect(isRetiredModel(type, id)).toBe(true);
    expect(retiredSuccessor(type, id)).toBe(successor);
    expect(model).toBe(successor);
  });

  it("should keep a model the provider still serves, even if uncatalogued", () => {
    // Arrange
    const id = "claude-custom-preview";

    // Act
    const model = usableModel("anthropic", id);

    // Assert
    expect(model).toBe(id);
    expect(retiredSuccessor("anthropic", id)).toBeUndefined();
  });

  it("should not treat an inherited object key as a retired model", () => {
    // Arrange
    const id = "toString";

    // Act
    const retired = isRetiredModel("anthropic", id);

    // Assert
    expect(retired).toBe(false);
    expect(usableModel("anthropic", id)).toBe(id);
  });
});

describe("deprecated models", () => {
  it.each(TYPES)(
    "should keep deprecated %s models out of the catalog with a served successor",
    (type) => {
      // Arrange
      const deprecated = Object.entries(DEPRECATED_MODELS[type]);

      // Act
      const leaked = deprecated.filter(([id]) => catalogIds(type).includes(id));
      const orphaned = deprecated.filter(
        ([, d]) => !catalogIds(type).includes(d.successor)
      );

      // Assert
      expect(leaked).toEqual([]);
      expect(orphaned).toEqual([]);
    }
  );

  it("should report the successor of a deprecated model without healing it", () => {
    // Arrange
    const id = "claude-sonnet-4-0";

    // Act
    const deprecation = deprecationOf("anthropic", id);

    // Assert
    expect(deprecation).toEqual({
      successor: "claude-sonnet-5",
      retiresOn: null,
    });
    expect(usableModel("anthropic", id)).toBe(id);
  });
});

describe("modelForProvider", () => {
  it("should use the type default when the provider stores no model", () => {
    // Arrange
    const provider = { type: "anthropic" as const };

    // Act
    const model = modelForProvider(provider);

    // Assert
    expect(model).toBe(getDefaultModel("anthropic"));
  });

  it("should heal a stored retired model instead of passing it through", () => {
    // Arrange
    const provider = {
      type: "anthropic" as const,
      model: "claude-3-haiku-20240307",
    };

    // Act
    const model = modelForProvider(provider);

    // Assert
    expect(model).toBe("claude-haiku-4-5");
  });

  it("should keep a stored served model", () => {
    // Arrange
    const provider = { type: "openai" as const, model: "gpt-5" };

    // Act
    const model = modelForProvider(provider);

    // Assert
    expect(model).toBe("gpt-5");
  });
});
