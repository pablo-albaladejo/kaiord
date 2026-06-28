import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../test-utils";
import { StepNotesEditor } from "./StepNotesEditor";

const NOTES_CHARACTER_LIMIT = 256;

const NOTES_OVER_LIMIT_LENGTH = 260;

describe("StepNotesEditor", () => {
  describe("rendering", () => {
    it("should render with default empty value", () => {
      // Arrange

      // Act
      render(<StepNotesEditor value="" onChange={vi.fn()} />);
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });

      // Assert
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue("");
    });

    it("should render with provided value", () => {
      // Arrange

      // Act
      render(
        <StepNotesEditor
          value="Easy warmup, focus on form"
          onChange={vi.fn()}
        />
      );
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });

      // Assert
      expect(textarea).toHaveValue("Easy warmup, focus on form");
    });

    it("should display character count", () => {
      // Arrange

      // Act
      render(<StepNotesEditor value="Test notes" onChange={vi.fn()} />);

      // Assert
      expect(screen.getByText(/10 \/ 256 characters/i)).toBeInTheDocument();
    });

    it("should display placeholder text", () => {
      // Arrange

      // Act
      render(<StepNotesEditor value="" onChange={vi.fn()} />);
      const textarea = screen.getByPlaceholderText(
        /add coaching cues or notes for this step/i
      );

      // Assert
      expect(textarea).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onChange when text is entered", async () => {
      // Arrange
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<StepNotesEditor value="" onChange={handleChange} />);

      // Act
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });
      await user.type(textarea, "New note");

      // Assert
      expect(handleChange).toHaveBeenCalled();
      expect(textarea).toHaveValue("New note");
    });

    it("should update character count as user types", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<StepNotesEditor value="" onChange={vi.fn()} />);

      // Act
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });
      await user.type(textarea, "Hello");

      // Assert
      expect(screen.getByText(/5 \/ 256 characters/i)).toBeInTheDocument();
    });

    it("should not allow input when disabled", () => {
      // Arrange

      // Act
      render(<StepNotesEditor value="" onChange={vi.fn()} disabled />);
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });

      // Assert
      expect(textarea).toBeDisabled();
    });
  });

  describe("character limit", () => {
    it("should show warning when exceeding 256 characters", async () => {
      // Arrange
      const longText = "a".repeat(NOTES_OVER_LIMIT_LENGTH);
      const user = userEvent.setup();
      render(<StepNotesEditor value="" onChange={vi.fn()} />);

      // Act
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });
      await user.clear(textarea);
      await user.type(textarea, longText);

      // Assert
      expect(screen.getByText(/260 \/ 256 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/\(4 over limit\)/i)).toBeInTheDocument();
    });

    it("should apply error styling when over limit", async () => {
      // Arrange
      const longText = "a".repeat(NOTES_OVER_LIMIT_LENGTH);
      const user = userEvent.setup();
      render(<StepNotesEditor value="" onChange={vi.fn()} />);

      // Act
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });
      await user.clear(textarea);
      await user.type(textarea, longText);

      // Assert
      expect(textarea).toHaveClass("border-red-500");
      expect(textarea).toHaveAttribute("aria-invalid", "true");
    });

    it("should not show warning when at exactly 256 characters", async () => {
      // Arrange
      const exactText = "a".repeat(NOTES_CHARACTER_LIMIT);
      const user = userEvent.setup();
      render(<StepNotesEditor value="" onChange={vi.fn()} />);

      // Act
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });
      await user.clear(textarea);
      await user.type(textarea, exactText);

      // Assert
      expect(screen.getByText(/256 \/ 256 characters/i)).toBeInTheDocument();
      expect(screen.queryByText(/over limit/i)).not.toBeInTheDocument();
    });

    it("should show normal styling when under limit", () => {
      // Arrange

      // Act
      render(<StepNotesEditor value="Short note" onChange={vi.fn()} />);
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });

      // Assert
      expect(textarea).not.toHaveClass("border-red-500");
      expect(textarea).toHaveAttribute("aria-invalid", "false");
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA labels", () => {
      // Arrange

      // Act
      render(<StepNotesEditor value="" onChange={vi.fn()} />);
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });

      // Assert
      expect(textarea).toHaveAttribute("aria-describedby", "character-count");
    });

    it("should announce character count changes", () => {
      // Arrange

      // Act
      render(<StepNotesEditor value="Test" onChange={vi.fn()} />);
      const characterCount = screen.getByRole("status");

      // Assert
      expect(characterCount).toHaveAttribute("aria-live", "polite");
    });

    it("should mark as invalid when over limit", async () => {
      // Arrange
      const longText = "a".repeat(NOTES_OVER_LIMIT_LENGTH);
      const user = userEvent.setup();
      render(<StepNotesEditor value="" onChange={vi.fn()} />);

      // Act
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });
      await user.clear(textarea);
      await user.type(textarea, longText);

      // Assert
      expect(textarea).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("states", () => {
    it("should apply custom className", () => {
      // Arrange

      // Act
      const { container } = render(
        <StepNotesEditor value="" onChange={vi.fn()} className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;

      // Assert
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should handle undefined value prop", () => {
      // Arrange

      // Act
      render(<StepNotesEditor onChange={vi.fn()} />);
      const textarea = screen.getByRole("textbox", {
        name: /notes & coaching cues/i,
      });

      // Assert
      expect(textarea).toHaveValue("");
    });
  });
});
