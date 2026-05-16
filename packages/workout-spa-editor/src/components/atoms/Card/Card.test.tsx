import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Card } from "./Card";

describe("Card", () => {
  describe("rendering", () => {
    it("should render children content", () => {
      // Arrange

      // Act

      render(<Card>Content here</Card>);

      // Assert

      expect(screen.getByText("Content here")).toBeInTheDocument();
    });

    it("should apply default base classes", () => {
      // Arrange

      render(<Card data-testid="card">Body</Card>);

      // Act

      const card = screen.getByTestId("card");

      // Assert

      expect(card).toHaveClass("rounded-lg");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("bg-white");
      expect(card).toHaveClass("shadow-sm");
    });

    it("should apply dark mode classes", () => {
      // Arrange

      render(<Card data-testid="card">Body</Card>);

      // Act

      const card = screen.getByTestId("card");

      // Assert

      expect(card).toHaveClass("dark:border-gray-700");
      expect(card).toHaveClass("dark:bg-gray-800");
    });
  });

  describe("variants", () => {
    it("should render default variant without interactive classes", () => {
      // Arrange

      render(
        <Card variant="default" data-testid="card">
          Body
        </Card>
      );

      // Act

      const card = screen.getByTestId("card");

      // Assert

      expect(card).not.toHaveClass("hover:shadow-lg");
    });

    it("should render interactive variant with hover effect", () => {
      // Arrange

      render(
        <Card variant="interactive" data-testid="card">
          Body
        </Card>
      );

      // Act

      const card = screen.getByTestId("card");

      // Assert

      expect(card).toHaveClass("hover:shadow-lg");
      expect(card).toHaveClass("transition-all");
      expect(card).toHaveClass("group");
      expect(card).toHaveClass("overflow-hidden");
    });
  });

  describe("custom props", () => {
    it("should accept custom className", () => {
      // Arrange

      render(
        <Card className="custom-class" data-testid="card">
          Body
        </Card>
      );

      // Act

      const card = screen.getByTestId("card");

      // Assert

      expect(card).toHaveClass("custom-class");
    });

    it("should forward ref to underlying div", () => {
      // Arrange

      const ref = vi.fn();

      // Act

      render(<Card ref={ref}>Body</Card>);

      // Assert

      expect(ref).toHaveBeenCalled();
    });

    it("should pass through HTML attributes like data-testid", () => {
      // Arrange

      render(<Card data-testid="library-card">Body</Card>);

      // Act

      const card = screen.getByTestId("library-card");

      // Assert

      expect(card).toBeInTheDocument();
    });
  });
});
