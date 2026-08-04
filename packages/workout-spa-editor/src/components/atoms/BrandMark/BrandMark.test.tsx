import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandMark } from "./BrandMark";
import { MARK_NODES, MARK_SPOKES } from "./mark-geometry";

const markOf = (container: HTMLElement) =>
  container.querySelector("svg") as SVGSVGElement;

describe("BrandMark", () => {
  it("should take its ink from the surrounding color, never a baked hex", () => {
    // Arrange
    const { container } = render(<BrandMark />);

    // Act
    const svg = markOf(container);

    // Assert
    expect(svg.outerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(svg.querySelector("path")).toHaveAttribute("stroke", "currentColor");
  });

  it("should let the core read --core-live when asked for the live form", () => {
    // Arrange
    const { container } = render(<BrandMark core="live" />);

    // Act
    const core = markOf(container).querySelector('circle[cx="16"][cy="16"]');

    // Assert
    expect(core).toHaveAttribute("fill", "var(--core-live, currentColor)");
  });

  it("should keep the core on currentColor by default", () => {
    // Arrange
    const { container } = render(<BrandMark />);

    // Act
    const core = markOf(container).querySelector('circle[cx="16"][cy="16"]');

    // Assert
    expect(core).toHaveAttribute("fill", "currentColor");
  });

  it("should draw the full hub at the header size", () => {
    // Arrange
    const { container } = render(<BrandMark size={28} />);

    // Act
    const svg = markOf(container);

    // Assert
    expect(svg.querySelectorAll("line")).toHaveLength(MARK_SPOKES.length);
    expect(svg.querySelectorAll("circle")).toHaveLength(MARK_NODES.length + 1);
  });

  it("should drop the spokes and nodes below 24px, where they read as grey", () => {
    // Arrange
    const { container } = render(<BrandMark size={16} />);

    // Act
    const svg = markOf(container);

    // Assert
    expect(svg.querySelectorAll("line")).toHaveLength(0);
    expect(svg.querySelectorAll("circle")).toHaveLength(1);
  });

  it("should be hidden from assistive tech unless it is given a title", () => {
    // Arrange
    const { container } = render(<BrandMark />);

    // Act
    const svg = markOf(container);

    // Assert
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("should announce itself when given a title", () => {
    // Arrange
    const { container } = render(<BrandMark title="Kaiord" />);

    // Act
    const svg = markOf(container);

    // Assert
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", "Kaiord");
  });
});
