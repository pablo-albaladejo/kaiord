import { describe, expect, it } from "vitest";

import { resolveWhoopLabParameterKey } from "./resolve-whoop-lab-parameter-key";

describe("resolveWhoopLabParameterKey", () => {
  it("should resolve a slug that exactly matches a catalog key", () => {
    // Arrange
    const slug = "alt";

    // Act
    const key = resolveWhoopLabParameterKey(slug, "ALT");

    // Assert
    expect(key).toBe("alt");
  });

  it("should resolve by display name when the slug does not match a catalog key", () => {
    // Arrange
    const slug = "hdl_cholesterol";
    const displayName = "HDL cholesterol";

    // Act
    const key = resolveWhoopLabParameterKey(slug, displayName);

    // Assert
    expect(key).toBe("hdl");
  });

  it("should match the display name case-insensitively", () => {
    // Arrange
    const slug = "hdl_cholesterol";
    const displayName = "hdl CHOLESTEROL";

    // Act
    const key = resolveWhoopLabParameterKey(slug, displayName);

    // Assert
    expect(key).toBe("hdl");
  });

  it("should fall back to a custom key when neither slug nor label resolve", () => {
    // Arrange
    const slug = "custom_marker";

    // Act
    const key = resolveWhoopLabParameterKey(slug, "Custom Marker");

    // Assert
    expect(key).toBe("custom:custom_marker");
  });

  it("should fall back to a custom key when the display name is missing", () => {
    // Arrange
    const slug = "unknown_thing";

    // Act
    const key = resolveWhoopLabParameterKey(slug, null);

    // Assert
    expect(key).toBe("custom:unknown_thing");
  });
});
