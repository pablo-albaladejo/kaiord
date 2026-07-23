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

  it.each([
    { displayName: "HDL cholesterol" },
    { displayName: "hdl CHOLESTEROL" },
  ])(
    "should resolve the unmatched slug by its $displayName display name, case-insensitively",
    ({ displayName }) => {
      // Arrange
      const slug = "hdl_cholesterol";

      // Act
      const key = resolveWhoopLabParameterKey(slug, displayName);

      // Assert
      expect(key).toBe("hdl");
    }
  );

  it.each([
    {
      scenario: "neither slug nor label resolve",
      slug: "custom_marker",
      displayName: "Custom Marker" as string | null,
      expected: "custom:custom_marker",
    },
    {
      scenario: "the display name is missing",
      slug: "unknown_thing",
      displayName: null as string | null,
      expected: "custom:unknown_thing",
    },
  ])(
    "should fall back to a custom key when $scenario",
    ({ slug, displayName, expected }) => {
      // Arrange

      // Act
      const key = resolveWhoopLabParameterKey(slug, displayName);

      // Assert
      expect(key).toBe(expected);
    }
  );
});
