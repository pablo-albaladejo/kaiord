import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormatBadge } from "./FormatBadge";

describe("FormatBadge", () => {
  it("should render FIT badge", () => {
    // Arrange & Act
    render(<FormatBadge format="fit" />);

    // Assert
    expect(screen.getByText("FIT")).toBeInTheDocument();
  });

  it("should render TCX badge", () => {
    // Arrange & Act
    render(<FormatBadge format="tcx" />);

    // Assert
    expect(screen.getByText("TCX")).toBeInTheDocument();
  });

  it("should render PWX badge", () => {
    // Arrange & Act
    render(<FormatBadge format="pwx" />);

    // Assert
    expect(screen.getByText("PWX")).toBeInTheDocument();
  });

  it("should render KRD badge", () => {
    // Arrange & Act
    render(<FormatBadge format="krd" />);

    // Assert
    expect(screen.getByText("KRD")).toBeInTheDocument();
  });

  it("should apply correct color classes for FIT format", () => {
    // Arrange & Act
    const { container } = render(<FormatBadge format="fit" />);

    // Assert
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("bg-blue-100");
    expect(badge).toHaveClass("text-blue-800");
  });

  it("should apply correct color classes for TCX format", () => {
    // Arrange & Act
    const { container } = render(<FormatBadge format="tcx" />);

    // Assert
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("bg-green-100");
    expect(badge).toHaveClass("text-green-800");
  });

  it("should apply correct color classes for PWX format", () => {
    // Arrange & Act
    const { container } = render(<FormatBadge format="pwx" />);

    // Assert
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("bg-purple-100");
    expect(badge).toHaveClass("text-purple-800");
  });

  it("should apply correct color classes for KRD format", () => {
    // Arrange & Act
    const { container } = render(<FormatBadge format="krd" />);

    // Assert
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-800");
  });
});
