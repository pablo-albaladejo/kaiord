import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getSeriesStrokes,
  SERIES_STROKE_STEPS,
  seriesStroke,
} from "./series-strokes";

const LADDER_ROLES = ["--ink-strong", "--ink-body", "--ink-muted"] as const;

const DARK_VALUES: Record<string, string> = {
  "--ink-strong": "#ffffff",
  "--ink-body": "#d4d4d4",
  "--ink-muted": "#909090",
};

const stubComputedStyle = (values: Record<string, string>) =>
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    getPropertyValue: (name: string) => values[name] ?? "",
  } as unknown as CSSStyleDeclaration);

describe("getSeriesStrokes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should resolve every ladder step from the document root in order", () => {
    // Arrange
    stubComputedStyle(DARK_VALUES);

    // Act
    const strokes = getSeriesStrokes();

    // Assert
    expect(strokes).toEqual(LADDER_ROLES.map((role) => DARK_VALUES[role]));
  });

  it("should give each series a distinct step", () => {
    // Arrange
    stubComputedStyle(DARK_VALUES);

    // Act
    const strokes = getSeriesStrokes();

    // Assert
    expect(new Set(strokes).size).toBe(SERIES_STROKE_STEPS);
  });

  it("should fall back to the light-theme ink values with no custom properties", () => {
    // Arrange
    stubComputedStyle({});

    // Act
    const strokes = getSeriesStrokes();

    // Assert
    expect(strokes).toEqual(["#303030", "#5b5b5b", "#747474"]);
  });

  it("should never resolve a step to a zone hue", () => {
    // Arrange
    stubComputedStyle({});

    // Act
    const strokes = getSeriesStrokes();

    // Assert
    for (const stroke of strokes) {
      const [, r, g, b] = /^#(..)(..)(..)$/.exec(stroke) ?? [];
      expect(r).toBe(g);
      expect(g).toBe(b);
    }
  });
});

describe("seriesStroke", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return the step at the given index", () => {
    // Arrange
    stubComputedStyle(DARK_VALUES);

    // Act
    const stroke = seriesStroke(2);

    // Assert
    expect(stroke).toBe(DARK_VALUES["--ink-muted"]);
  });

  it("should wrap past the last step", () => {
    // Arrange
    stubComputedStyle(DARK_VALUES);

    // Act
    const wrapped = seriesStroke(SERIES_STROKE_STEPS + 1);

    // Assert
    expect(wrapped).toBe(seriesStroke(1));
  });
});
