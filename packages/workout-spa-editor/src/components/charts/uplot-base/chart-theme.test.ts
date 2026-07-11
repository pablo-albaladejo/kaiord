import { afterEach, describe, expect, it, vi } from "vitest";

import { getChartAxisColors, themedAxis } from "./chart-theme";

// Mirrors the :root defaults in src/index.css.
const FALLBACK_STROKE = "#64748b";
const FALLBACK_GRID = "#e2e8f0";

const stubComputedStyle = (
  values: Record<string, string>
): ReturnType<typeof vi.spyOn> =>
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    getPropertyValue: (name: string) => values[name] ?? "",
  } as unknown as CSSStyleDeclaration);

describe("getChartAxisColors", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should read stroke and grid colors from the document root's computed style", () => {
    // Arrange
    stubComputedStyle({ "--ink-muted": "#111111", "--edge": "#222222" });

    // Act
    const colors = getChartAxisColors();

    // Assert
    expect(colors).toEqual({ stroke: "#111111", grid: "#222222" });
  });

  it("should fall back to the light-theme defaults when a custom property is empty", () => {
    // Arrange
    stubComputedStyle({});

    // Act
    const colors = getChartAxisColors();

    // Assert
    expect(colors).toEqual({ stroke: FALLBACK_STROKE, grid: FALLBACK_GRID });
  });
});

describe("themedAxis", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should style an axis with the current stroke, grid, and tick colors", () => {
    // Arrange
    stubComputedStyle({ "--ink-muted": "#111111", "--edge": "#222222" });

    // Act
    const axis = themedAxis({ scale: "hrv", side: 1 });

    // Assert
    expect(axis.scale).toBe("hrv");
    expect(axis.stroke).toBe("#111111");
    expect(axis.grid).toEqual({ stroke: "#222222" });
    expect(axis.ticks).toEqual({ stroke: "#222222" });
  });

  it("should let an axis override the grid stroke it is given", () => {
    // Arrange
    stubComputedStyle({ "--ink-muted": "#111111", "--edge": "#222222" });

    // Act
    const axis = themedAxis({ grid: { stroke: "#ff0000" } });

    // Assert
    expect(axis.grid).toEqual({ stroke: "#ff0000" });
  });
});
