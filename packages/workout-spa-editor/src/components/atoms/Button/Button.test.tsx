import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  describe("rendering", () => {
    it("should render with default props", () => {
      // Arrange

      render(<Button>Click me</Button>);

      // Act

      const button = screen.getByRole("button", { name: "Click me" });

      // Assert

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-primary-600");
      expect(button).toHaveClass("px-4");
    });

    it("should render children content", () => {
      // Arrange

      // Act

      render(<Button>Test Content</Button>);

      // Assert

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("should render primary variant", () => {
      // Arrange

      render(<Button variant="primary">Primary</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("bg-primary-600");
      expect(button).toHaveClass("text-white");
    });

    it("should render secondary variant", () => {
      // Arrange

      render(<Button variant="secondary">Secondary</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("border");
      expect(button).toHaveClass("bg-white");
    });

    it("should render tertiary variant", () => {
      // Arrange

      render(<Button variant="tertiary">Tertiary</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("bg-transparent");
    });

    it("should render danger variant", () => {
      // Arrange

      render(<Button variant="danger">Danger</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("bg-red-600");
      expect(button).toHaveClass("text-white");
    });
  });

  describe("sizes", () => {
    it("should render small size", () => {
      // Arrange

      render(<Button size="sm">Small</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("px-3");
      expect(button).toHaveClass("py-2.5"); // Updated for WCAG 44px minimum
      expect(button).toHaveClass("text-sm");
      expect(button).toHaveClass("min-h-[44px]"); // WCAG 2.1 AA compliance
    });

    it("should render medium size", () => {
      // Arrange

      render(<Button size="md">Medium</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2.5"); // Updated for WCAG 44px minimum
      expect(button).toHaveClass("text-base");
      expect(button).toHaveClass("min-h-[44px]"); // WCAG 2.1 AA compliance
    });

    it("should render large size", () => {
      // Arrange

      render(<Button size="lg">Large</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("px-6");
      expect(button).toHaveClass("py-3");
      expect(button).toHaveClass("text-lg");
      expect(button).toHaveClass("min-h-[48px]"); // Larger for better UX
    });
  });

  describe("states", () => {
    it("should be disabled when disabled prop is true", () => {
      // Arrange

      render(<Button disabled>Disabled</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:cursor-not-allowed");
    });

    it("should show loading spinner when loading", () => {
      // Arrange

      render(<Button loading>Loading</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toBeDisabled();

      const spinner = button.querySelector("svg");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("animate-spin");
    });

    it("should disable button when loading", () => {
      // Arrange

      render(<Button loading>Loading</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("should call onClick when clicked", async () => {
      // Arrange

      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button");

      // Act

      await user.click(button);

      // Assert

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", async () => {
      // Arrange

      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole("button");

      // Act

      await user.click(button);

      // Assert

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should not call onClick when loading", async () => {
      // Arrange

      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );

      const button = screen.getByRole("button");

      // Act

      await user.click(button);

      // Assert

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("custom props", () => {
    it("should accept custom className", () => {
      // Arrange

      render(<Button className="custom-class">Custom</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("custom-class");
    });

    it("should forward ref", () => {
      // Arrange

      const ref = vi.fn();

      // Act

      render(<Button ref={ref}>Ref Button</Button>);

      // Assert

      expect(ref).toHaveBeenCalled();
    });

    it("should have type button by default", () => {
      // Arrange

      render(<Button>Default Type</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveAttribute("type", "button");
    });

    it("should allow type override to submit", () => {
      // Arrange

      render(<Button type="submit">Submit</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveAttribute("type", "submit");
    });

    it("should pass through HTML button attributes", () => {
      // Arrange

      render(
        <Button type="submit" aria-label="Submit form">
          Submit
        </Button>
      );

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveAttribute("type", "submit");
      expect(button).toHaveAttribute("aria-label", "Submit form");
    });
  });
});
