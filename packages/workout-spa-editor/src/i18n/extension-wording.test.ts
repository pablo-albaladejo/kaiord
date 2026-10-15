import { describe, expect, it } from "vitest";

const MODULES = import.meta.glob<Record<string, unknown>>(
  "./locales/*/*.json",
  {
    eager: true,
    import: "default",
  }
);

const collectValues = (node: unknown): string[] => {
  if (typeof node === "string") return [node];
  if (node && typeof node === "object")
    return Object.values(node).flatMap(collectValues);
  return [];
};

describe("extension wording", () => {
  it("should not call the browser extension a bridge in any locale value", () => {
    // Arrange
    const catalogs = Object.entries(MODULES);

    // Act
    const offenders = catalogs.flatMap(([path, dict]) =>
      collectValues(dict)
        .filter((value) => /puente|bridge/i.test(value))
        .map((value) => `${path}: ${value}`)
    );

    // Assert
    expect(offenders).toEqual([]);
  });
});
