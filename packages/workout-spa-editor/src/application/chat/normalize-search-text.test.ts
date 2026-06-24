import { describe, expect, it } from "vitest";

import {
  countOccurrences,
  normalizeSearchText,
  normalizeWithMap,
  tokenize,
} from "./normalize-search-text";

describe("normalizeSearchText", () => {
  it("should strip diacritics and lowercase", () => {
    // Arrange
    const text = "Úmbral VO2máx";

    // Act
    const normalized = normalizeSearchText(text);

    // Assert
    expect(normalized).toBe("umbral vo2max");
  });
});

describe("tokenize", () => {
  it("should split on whitespace and normalize", () => {
    // Arrange
    const query = "  Umbral   VO2 ";

    // Act
    const tokens = tokenize(query);

    // Assert
    expect(tokens).toEqual(["umbral", "vo2"]);
  });

  it("should discard single-character tokens", () => {
    // Arrange
    const query = "y vo2";

    // Act
    const tokens = tokenize(query);

    // Assert
    expect(tokens).toEqual(["vo2"]);
  });

  it("should preserve two-character tokens", () => {
    // Arrange
    const query = "z4 z2";

    // Act
    const tokens = tokenize(query);

    // Assert
    expect(tokens).toEqual(["z4", "z2"]);
  });

  it("should yield no tokens for an empty or whitespace query", () => {
    // Arrange
    const query = "   \n ";

    // Act
    const tokens = tokenize(query);

    // Assert
    expect(tokens).toEqual([]);
  });
});

describe("normalizeWithMap", () => {
  it("should map each normalized char back to its original index", () => {
    // Arrange
    const text = "éa";

    // Act
    const { normalized, map } = normalizeWithMap(text);

    // Assert
    expect(normalized).toBe("ea");
    expect(map).toEqual([0, 1]);
  });

  it("should keep original offsets aligned after an accented match", () => {
    // Arrange
    const text = "del úmbral";

    // Act
    const { normalized, map } = normalizeWithMap(text);
    const at = normalized.indexOf("umbral");

    // Assert
    expect(text.slice(map[at], map[at] + "úmbral".length)).toBe("úmbral");
  });
});

describe("countOccurrences", () => {
  it("should count non-overlapping token occurrences", () => {
    // Arrange
    const normalized = "vo2 y mas vo2max";

    // Act
    const count = countOccurrences(normalized, "vo2");

    // Assert
    expect(count).toBe(2);
  });
});
