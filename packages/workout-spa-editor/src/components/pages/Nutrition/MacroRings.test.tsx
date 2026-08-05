import type { MacroNutrients } from "@kaiord/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MacroRings } from "./MacroRings";

const TARGETS: MacroNutrients = {
  kcal: 2450,
  protein_g: 150,
  carb_g: 300,
  fat_g: 70,
};

// Under target on every macro except fat, which is over it.
const ACTUALS: MacroNutrients = {
  kcal: 2140,
  protein_g: 124,
  carb_g: 268,
  fat_g: 78,
};

const RING_KEYS = ["energy", "protein", "carb", "fat"] as const;

const strokesOf = (container: HTMLElement): string[] =>
  [...container.querySelectorAll("circle")].map(
    (c) => c.getAttribute("stroke") ?? ""
  );

describe("MacroRings", () => {
  it("should render one ring per macro", () => {
    // Arrange
    const actuals = ACTUALS;

    // Act
    render(<MacroRings actuals={actuals} targets={TARGETS} />);

    // Assert
    for (const key of RING_KEYS) {
      expect(screen.getByTestId(`macro-ring-${key}`)).toBeInTheDocument();
    }
  });

  it("should draw every ring from the ink roles rather than a per-macro hue", () => {
    // Arrange
    const actuals = ACTUALS;

    // Act
    const { container } = render(
      <MacroRings actuals={actuals} targets={TARGETS} />
    );
    const strokes = strokesOf(container);

    // Assert
    expect(strokes.length).toBeGreaterThan(0);
    for (const stroke of strokes) {
      expect(stroke).toMatch(/^var\(--[a-z-]+\)$/);
    }
  });

  it("should give the over-target ring the same arc as the others", () => {
    // Arrange
    const actuals = ACTUALS;

    // Act
    const { container } = render(
      <MacroRings actuals={actuals} targets={TARGETS} />
    );
    const arcs = [...container.querySelectorAll("circle")]
      .filter((c) => c.getAttribute("stroke-linecap") === "round")
      .map((c) => c.getAttribute("stroke"));

    // Assert
    expect(new Set(arcs).size).toBe(1);
  });

  it("should name the over-target macro with a glyph and a word", () => {
    // Arrange
    const actuals = ACTUALS;

    // Act
    render(<MacroRings actuals={actuals} targets={TARGETS} />);
    const label = screen.getByTestId("macro-ring-over-fat");

    // Assert
    expect(label.querySelector("svg")).toBeInTheDocument();
    expect(label).toHaveTextContent(/over/i);
    expect(label).toHaveTextContent(/fat/i);
  });

  it("should stay silent on a macro that is under its target", () => {
    // Arrange
    const actuals = ACTUALS;

    // Act
    render(<MacroRings actuals={actuals} targets={TARGETS} />);

    // Assert
    for (const key of ["energy", "protein", "carb"] as const) {
      expect(
        screen.queryByTestId(`macro-ring-over-${key}`)
      ).not.toBeInTheDocument();
    }
  });

  it("should render the raw figures with no target to compare against", () => {
    // Arrange
    const actuals = ACTUALS;

    // Act
    render(<MacroRings actuals={actuals} targets={undefined} />);

    // Assert
    for (const key of RING_KEYS) {
      expect(screen.getByTestId(`macro-ring-${key}`)).toBeInTheDocument();
      expect(
        screen.queryByTestId(`macro-ring-over-${key}`)
      ).not.toBeInTheDocument();
    }
  });
});
