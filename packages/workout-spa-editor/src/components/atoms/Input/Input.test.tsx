import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  describe("text variant", () => {
    it("should render text input with default props", () => {
      // Arrange & Act
      render(<Input />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("should render with label", () => {
      // Arrange & Act
      render(<Input label="Username" />);

      // Assert
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
    });

    it("should render with helper text", () => {
      // Arrange & Act
      render(<Input helperText="Enter your username" />);

      // Assert
      expect(screen.getByText("Enter your username")).toBeInTheDocument();
    });

    it("should render with placeholder", () => {
      // Arrange & Act
      render(<Input placeholder="Enter text..." />);

      // Assert
      expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
    });
  });

  describe("number variant", () => {
    it("should render number input", () => {
      // Arrange & Act
      render(<Input variant="number" />);

      // Assert
      const input = screen.getByRole("spinbutton");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "number");
    });

    it("should accept number-specific attributes", () => {
      // Arrange & Act
      render(<Input variant="number" min={0} max={100} step={5} />);

      // Assert
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "100");
      expect(input).toHaveAttribute("step", "5");
    });
  });

  describe("select variant", () => {
    it("should render select with options", () => {
      // Arrange
      const options = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
        { value: "option3", label: "Option 3" },
      ];

      // Act
      render(<Input variant="select" options={options} />);

      // Assert
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("should render with default selected value", () => {
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
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("option2");
    });
  });

  describe("error state", () => {
    it("should render error message", () => {
      // Arrange & Act
      render(<Input error="This field is required" />);

      // Assert
      expect(screen.getByText("This field is required")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should apply error styling", () => {
      // Arrange & Act
      render(<Input error="Invalid input" />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should hide helper text when error is present", () => {
      // Arrange & Act
      render(<Input helperText="Helper text" error="Error message" />);

      // Assert
      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    });

    it("should associate error with input via aria-describedby", () => {
      // Arrange & Act
      render(<Input error="Error message" />);

      // Assert
      const input = screen.getByRole("textbox");
      const errorId = input.getAttribute("aria-describedby");
      expect(errorId).toBeTruthy();
      expect(screen.getByText("Error message")).toHaveAttribute("id", errorId);
    });
  });

  describe("sizes", () => {
    it("should apply small size classes", () => {
      // Arrange & Act
      render(<Input size="sm" />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("text-sm");
    });

    it("should apply medium size classes", () => {
      // Arrange & Act
      render(<Input size="md" />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("text-base");
    });

    it("should apply large size classes", () => {
      // Arrange & Act
      render(<Input size="lg" />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("text-lg");
    });
  });

  describe("disabled state", () => {
    it("should render disabled input", () => {
      // Arrange & Act
      render(<Input disabled />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should render disabled select", () => {
      // Arrange
      const options = [{ value: "option1", label: "Option 1" }];

      // Act
      render(<Input variant="select" options={options} disabled />);

      // Assert
      const select = screen.getByRole("combobox");
      expect(select).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("should associate label with input", () => {
      // Arrange & Act
      render(<Input label="Email" />);

      // Assert
      const input = screen.getByLabelText("Email");
      expect(input).toBeInTheDocument();
    });

    it("should associate helper text with input via aria-describedby", () => {
      // Arrange & Act
      render(<Input helperText="Enter your email address" />);

      // Assert
      const input = screen.getByRole("textbox");
      const helperId = input.getAttribute("aria-describedby");
      expect(helperId).toBeTruthy();
      expect(screen.getByText("Enter your email address")).toHaveAttribute(
        "id",
        helperId
      );
    });

    it("should have proper ARIA attributes for error state", () => {
      // Arrange & Act
      render(<Input error="Invalid email" />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby");
    });
  });

  describe("custom className", () => {
    it("should apply custom className to input", () => {
      // Arrange & Act
      render(<Input className="custom-class" />);

      // Assert
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-class");
    });
  });

  describe("ref forwarding", () => {
    it("should forward ref to input element", () => {
      // Arrange
      let inputRef: HTMLInputElement | HTMLSelectElement | null = null;

      // Act
      render(
        <Input
          ref={(el) => {
            inputRef = el;
          }}
        />
      );

      // Assert
      expect(inputRef).toBeInstanceOf(HTMLInputElement);
    });

    it("should forward ref to select element", () => {
      // Arrange
      let selectRef: HTMLInputElement | HTMLSelectElement | null = null;
      const options = [{ value: "option1", label: "Option 1" }];

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
      expect(selectRef).toBeInstanceOf(HTMLSelectElement);
    });
  });
});
