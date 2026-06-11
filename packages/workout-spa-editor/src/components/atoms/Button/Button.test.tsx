import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ButtonSize, ButtonVariant } from "./Button";
import { Button } from "./Button";

describe("Button", () => {
  describe("rendering", () => {
    it("should render its children as the accessible label", () => {
      // Arrange

      render(<Button>Click me</Button>);

      // Act

      const button = screen.getByRole("button", { name: "Click me" });

      // Assert

      expect(button).toBeInTheDocument();
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });
  });

  describe("variant class map", () => {
    it.each<[ButtonVariant, string]>([
      ["primary", "bg-primary-600"],
      ["secondary", "bg-white"],
      ["tertiary", "bg-transparent"],
      ["danger", "bg-red-600"],
    ])("should map the %s variant to its background class", (variant, bg) => {
      // Arrange

      render(<Button variant={variant}>{variant}</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass(bg);
    });
  });

  describe("size class map", () => {
    it.each<[ButtonSize, string, string]>([
      ["sm", "px-3", "min-h-[44px]"],
      ["md", "px-4", "min-h-[44px]"],
      ["lg", "px-6", "min-h-[48px]"],
    ])(
      "should map the %s size to its padding and WCAG minimum height",
      (size, padding, minHeight) => {
        // Arrange

        render(<Button size={size}>{size}</Button>);

        // Act

        const button = screen.getByRole("button");

        // Assert

        expect(button).toHaveClass(padding);
        expect(button).toHaveClass(minHeight);
      }
    );

    it("should meet the WCAG 44px minimum touch target by default", () => {
      // Arrange

      render(<Button>Default</Button>);

      // Act

      const button = screen.getByRole("button");

      // Assert

      expect(button).toHaveClass("min-h-[44px]");
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
