import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ZoneDist } from "./ZoneDist";

/* Fixtures use integer flex weights (the component only checks `> 0`), kept
   within the lint-ignored numeric set so the fixtures stay magic-number-free.
   Expected segment counts are derived from the data, never hardcoded. */
const positives = (dist: number[]): number =>
  dist.filter((value) => value > 0).length;

describe("ZoneDist", () => {
  it("should render one segment per positive fraction", () => {
    // Arrange
    const dist = [1, 2, 1, 2, 1];

    // Act
    const { container } = render(<ZoneDist dist={dist} />);

    // Assert
    const root = container.firstChild as HTMLDivElement;
    expect(root.children).toHaveLength(positives(dist));
  });

  it("should skip zero fractions", () => {
    // Arrange
    const dist = [2, 0, 1, 0, 1];

    // Act
    const { container } = render(<ZoneDist dist={dist} />);

    // Assert
    const root = container.firstChild as HTMLDivElement;
    expect(root.children).toHaveLength(positives(dist));
  });

  it("should skip negative fractions", () => {
    // Arrange
    const dist = [1, -1, 2, 0, 0];

    // Act
    const { container } = render(<ZoneDist dist={dist} />);

    // Assert
    const root = container.firstChild as HTMLDivElement;
    expect(root.children).toHaveLength(positives(dist));
  });

  it("should apply the height style", () => {
    // Arrange
    const dist = [1, 1, 0, 0, 0];

    // Act
    const { container } = render(<ZoneDist dist={dist} height={100} />);

    // Assert
    const root = container.firstChild as HTMLDivElement;
    expect(root.style.height).toBe("100px");
  });

  it("should apply default height of 8px when not specified", () => {
    // Arrange
    const dist = [1, 0, 0, 0, 0];

    // Act
    const { container } = render(<ZoneDist dist={dist} />);

    // Assert
    const root = container.firstChild as HTMLDivElement;
    expect(root.style.height).toBe("8px");
  });

  it("should apply custom className", () => {
    // Arrange
    const dist = [1, 0, 0, 0, 0];

    // Act
    const { container } = render(
      <ZoneDist dist={dist} className="custom-class" />
    );

    // Assert
    const root = container.firstChild as HTMLDivElement;
    expect(root).toHaveClass("custom-class");
  });
});
