import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "./Input";

describe("Input", () => {
  describe("text variant", () => {
    it("should render text input with default props", () => {
      // Arrange & Act
      // Arrange

      render(<Input />);

      // Assert

      // Act

      const input = screen.getByRole("textbox");

      // Assert

      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("should render with label", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<Input label="Username" />);

      // Assert

      // Assert

      expect(screen.getByLabelText("Username")).toBeInTheDocument();
    });

    it("should render with helper text", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<Input helperText="Enter your username" />);

      // Assert

      // Assert

      expect(screen.getByText("Enter your username")).toBeInTheDocument();
    });

    it("should render with placeholder", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<Input placeholder="Enter text..." />);

      // Assert

      // Assert

      expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
    });
  });

  describe("number variant", () => {
    it("should render number input", () => {
      // Arrange & Act
      // Arrange

      render(<Input variant="number" />);

      // Assert

      // Act

      const input = screen.getByRole("spinbutton");

      // Assert

      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "number");
    });

    it("should accept number-specific attributes", () => {
      // Arrange & Act
      // Arrange

      render(<Input variant="number" min={0} max={100} step={5} />);

      // Assert

      // Act

      const input = screen.getByRole("spinbutton");

      // Assert

      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "100");
      expect(input).toHaveAttribute("step", "5");
    });
  });

  describe("select variant", () => {
    it("should render select with options", () => {
      // Arrange
      // Arrange

      const options = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
        { value: "option3", label: "Option 3" },
      ];

      // Act
      render(<Input variant="select" options={options} />);

      // Assert

      // Act

      const select = screen.getByRole("combobox");

      // Assert

      expect(select).toBeInTheDocument();
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("should render with default selected value", () => {
      // Arrange
      // Arrange

      const options = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
      ];

      // Act
      render(
        <Input variant="select" options={options} defaultValue="option2" />
      );

      // Assert

      // Act

      const select = screen.getByRole("combobox") as HTMLSelectElement;

      // Assert

      expect(select.value).toBe("option2");
    });
  });

  describe("error state", () => {
    it("should render error message", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<Input error="This field is required" />);

      // Assert

      // Assert

      expect(screen.getByText("This field is required")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should apply error styling", () => {
      // Arrange & Act
      // Arrange

      render(<Input error="Invalid input" />);

      // Assert

      // Act

      const input = screen.getByRole("textbox");

      // Assert

      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should hide helper text when error is present", () => {
      // Arrange & Act
      // Arrange

      // Act

      render(<Input helperText="Helper text" error="Error message" />);

      // Assert

      // Assert

      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    });

    it("should associate error with input via aria-describedby", () => {
      // Arrange & Act
      // Arrange

      render(<Input error="Error message" />);

      // Assert
      const input = screen.getByRole("textbox");

      // Act

      const errorId = input.getAttribute("aria-describedby");

      // Assert

      expect(errorId).toBeTruthy();
      expect(screen.getByText("Error message")).toHaveAttribute("id", errorId);
    });
  });

  describe("sizes", () => {
    it("should apply small size classes", () => {
      // Arrange & Act
      // Arrange

      render(<Input size="sm" />);

      // Assert

      // Act

      const input = screen.getByRole("textbox");

      // Assert

      expect(input).toHaveClass("text-sm");
    });

    it("should apply medium size classes", () => {
      // Arrange & Act
      // Arrange

      render(<Input size="md" />);

      // Assert

      // Act

      const input = screen.getByRole("textbox");

      // Assert

      expect(input).toHaveClass("text-base");
    });

    it("should apply large size classes", () => {
      // Arrange & Act
      // Arrange

      render(<Input size="lg" />);

      // Assert

      // Act

      const input = screen.getByRole("textbox");

      // Assert

      expect(input).toHaveClass("text-lg");
    });
  });

  describe("disabled state", () => {
    it("should render disabled input", () => {
      // Arrange & Act
      // Arrange

      render(<Input disabled />);

      // Assert

      // Act

      const input = screen.getByRole("textbox");

      // Assert

      expect(input).toBeDisabled();
    });

    it("should render disabled select", () => {
      // Arrange
      // Arrange

      const options = [{ value: "option1", label: "Option 1" }];

      // Act
      render(<Input variant="select" options={options} disabled />);

      // Assert

      // Act

      const select = screen.getByRole("combobox");

      // Assert

      expect(select).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("should associate label with input", () => {
      // Arrange & Act
      // Arrange

      render(<Input label="Email" />);

      // Assert

      // Act

      const input = screen.getByLabelText("Email");

      // Assert

      expect(input).toBeInTheDocument();
    });

    it("should associate helper text with input via aria-describedby", () => {
      // Arrange & Act
      // Arrange

      render(<Input helperText="Enter your email address" />);

      // Assert
      const input = screen.getByRole("textbox");

      // Act

      const helperId = input.getAttribute("aria-describedby");

      // Assert

      expect(helperId).toBeTruthy();
      expect(screen.getByText("Enter your email address")).toHaveAttribute(
        "id",
        helperId
      );
    });

    it("should have proper ARIA attributes for error state", () => {
      // Arrange & Act
      // Arrange

      render(<Input error="Invalid email" />);

      // Assert

      // Act

      const input = screen.getByRole("textbox");

      // Assert

      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby");
    });
  });

  describe("custom className", () => {
    it("should apply custom className to input", () => {
      // Arrange & Act
      // Arrange

      render(<Input className="custom-class" />);

      // Assert

      // Act

      const input = screen.getByRole("textbox");

      // Assert

      expect(input).toHaveClass("custom-class");
    });
  });

  describe("ref forwarding", () => {
    it("should forward ref to input element", () => {
      // Arrange
      // Arrange

      let inputRef: HTMLInputElement | HTMLSelectElement | null = null;

      // Act

      // Act

      render(
        <Input
          ref={(el) => {
            inputRef = el;
          }}
        />
      );

      // Assert

      // Assert

      expect(inputRef).toBeInstanceOf(HTMLInputElement);
    });

    it("should forward ref to select element", () => {
      // Arrange
      // Arrange

      let selectRef: HTMLInputElement | HTMLSelectElement | null = null;
      const options = [{ value: "option1", label: "Option 1" }];

      // Act

      // Act

      render(
        <Input
          variant="select"
          options={options}
          ref={(el) => {
            selectRef = el;
          }}
        />
      );

      // Assert

      // Assert

      expect(selectRef).toBeInstanceOf(HTMLSelectElement);
    });
  });
});
