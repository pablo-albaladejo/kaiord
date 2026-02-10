import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "../../test-utils";
import type { RepetitionBlock, WorkoutStep } from "../../types/krd";
import { RepetitionBlockHeaderRight } from "./RepetitionBlockCard/RepetitionBlockHeaderRight";
import { StepCard } from "./StepCard/StepCard";

/**
 * Visual regression test for delete button styling consistency
 *
 * This test verifies that delete buttons across different components
 * maintain consistent styling for shared characteristics while
 * documenting intentional differences based on context.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
describe("Delete Button Styling Consistency", () => {
  const mockBlock: RepetitionBlock = {
    repeatCount: 3,
    steps: [
      {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 },
        },
      },
    ],
  };

  const mockStep: WorkoutStep = {
    stepIndex: 0,
    durationType: "time",
    duration: { type: "time", seconds: 300 },
    targetType: "power",
    target: {
      type: "power",
      value: { unit: "watts", value: 200 },
    },
  };

  describe("Shared Characteristics", () => {
    it("should use same icon type (Trash2) in both buttons", () => {
      // Arrange & Act
      const { container: blockContainer } = renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const { container: stepContainer } = renderWithProviders(
        <StepCard step={mockStep} onDelete={vi.fn()} />
      );

      // Assert - Both should have Trash2 icon (lucide-react renders as svg)
      const blockIcon = blockContainer.querySelector(
        '[data-testid="delete-block-button"] svg'
      );
      const stepIcon = stepContainer.querySelector(
        '[data-testid="delete-step-button"] svg'
      );

      expect(blockIcon).toBeInTheDocument();
      expect(stepIcon).toBeInTheDocument();
    });

    it("should use same icon size (h-4 w-4) in both buttons", () => {
      // Arrange & Act
      const { container: blockContainer } = renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const { container: stepContainer } = renderWithProviders(
        <StepCard step={mockStep} onDelete={vi.fn()} />
      );

      // Assert - Both icons should have h-4 w-4 classes
      const blockIcon = blockContainer.querySelector(
        '[data-testid="delete-block-button"] svg'
      );
      const stepIcon = stepContainer.querySelector(
        '[data-testid="delete-step-button"] svg'
      );

      expect(blockIcon).toHaveClass("h-4", "w-4");
      expect(stepIcon).toHaveClass("h-4", "w-4");
    });

    it("should have proper accessibility attributes", () => {
      // Arrange & Act
      renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      renderWithProviders(<StepCard step={mockStep} onDelete={vi.fn()} />);

      // Assert - Both should have aria-label
      const blockButton = screen.getByTestId("delete-block-button");
      const stepButton = screen.getByTestId("delete-step-button");

      expect(blockButton).toHaveAttribute("aria-label");
      expect(stepButton).toHaveAttribute("aria-label");
    });

    it("should have test identifiers", () => {
      // Arrange & Act
      renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      renderWithProviders(<StepCard step={mockStep} onDelete={vi.fn()} />);

      // Assert - Both should have data-testid
      expect(screen.getByTestId("delete-block-button")).toBeInTheDocument();
      expect(screen.getByTestId("delete-step-button")).toBeInTheDocument();
    });
  });

  describe("RepetitionBlock Delete Button Styling", () => {
    it("should have inline button styling with red text", () => {
      // Arrange & Act
      renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Assert
      const button = screen.getByTestId("delete-block-button");

      // Verify red color scheme (Requirement 5.1)
      expect(button).toHaveClass("text-red-600");

      // Verify hover states (Requirement 5.3)
      expect(button).toHaveClass("hover:text-red-700");
      expect(button).toHaveClass("hover:bg-red-50");

      // Verify dark mode support (Requirement 5.4)
      expect(button).toHaveClass("dark:text-red-400");
      expect(button).toHaveClass("dark:hover:text-red-300");
      expect(button).toHaveClass("dark:hover:bg-red-900/30");

      // Verify appropriate styling for inline context (Requirement 5.5)
      expect(button).toHaveClass("p-1"); // Smaller padding for inline
      expect(button).toHaveClass("rounded"); // Standard rounded corners
      expect(button).toHaveClass("transition-colors");
    });
  });

  describe("StepCard Delete Button Styling", () => {
    it("should have overlay button styling with background and border", () => {
      // Arrange & Act
      renderWithProviders(<StepCard step={mockStep} onDelete={vi.fn()} />);

      // Assert
      const button = screen.getByTestId("delete-step-button");

      // Verify red color scheme on hover (Requirement 5.1)
      expect(button).toHaveClass("hover:text-red-600");
      expect(button).toHaveClass("hover:border-red-500");

      // Verify hover states (Requirement 5.3)
      expect(button).toHaveClass("hover:bg-red-50");

      // Verify dark mode support (Requirement 5.4)
      expect(button).toHaveClass("dark:bg-gray-700");
      expect(button).toHaveClass("dark:hover:border-red-400");
      expect(button).toHaveClass("dark:hover:bg-red-900/30");
      expect(button).toHaveClass("dark:hover:text-red-400");

      // Verify appropriate styling for overlay context (Requirement 5.5)
      expect(button).toHaveClass("p-2"); // Larger padding for overlay
      expect(button).toHaveClass("rounded-full"); // Circular shape
      expect(button).toHaveClass("bg-white"); // Background for visibility
      expect(button).toHaveClass("border-2"); // Border for definition
      expect(button).toHaveClass("shadow-sm"); // Shadow for depth
    });
  });

  describe("Intentional Differences", () => {
    it("should have different positioning strategies", () => {
      // Arrange & Act
      renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      renderWithProviders(<StepCard step={mockStep} onDelete={vi.fn()} />);

      // Assert
      const blockButton = screen.getByTestId("delete-block-button");
      const stepButton = screen.getByTestId("delete-step-button");

      // RepetitionBlock: inline (no absolute positioning)
      expect(blockButton).not.toHaveClass("absolute");

      // StepCard: overlay (positioned via parent container)
      expect(stepButton).not.toHaveClass("absolute");
    });

    it("should have different initial state styling", () => {
      // Arrange & Act
      renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      renderWithProviders(<StepCard step={mockStep} onDelete={vi.fn()} />);

      // Assert
      const blockButton = screen.getByTestId("delete-block-button");
      const stepButton = screen.getByTestId("delete-step-button");

      // RepetitionBlock: transparent with red text
      expect(blockButton).toHaveClass("text-red-600");
      expect(blockButton).not.toHaveClass("bg-white");

      // StepCard: white background with gray text
      expect(stepButton).toHaveClass("bg-white");
      expect(stepButton).toHaveClass("text-gray-500");
    });

    it("should have different padding sizes", () => {
      // Arrange & Act
      renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      renderWithProviders(<StepCard step={mockStep} onDelete={vi.fn()} />);

      // Assert
      const blockButton = screen.getByTestId("delete-block-button");
      const stepButton = screen.getByTestId("delete-step-button");

      // RepetitionBlock: smaller padding (p-1) for inline context
      expect(blockButton).toHaveClass("p-1");

      // StepCard: larger padding (p-2) for overlay context
      expect(stepButton).toHaveClass("p-2");
    });

    it("should have different border radius", () => {
      // Arrange & Act
      renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      renderWithProviders(<StepCard step={mockStep} onDelete={vi.fn()} />);

      // Assert
      const blockButton = screen.getByTestId("delete-block-button");
      const stepButton = screen.getByTestId("delete-step-button");

      // RepetitionBlock: standard rounded corners
      expect(blockButton).toHaveClass("rounded");
      expect(blockButton).not.toHaveClass("rounded-full");

      // StepCard: circular (rounded-full)
      expect(stepButton).toHaveClass("rounded-full");
    });
  });

  describe("Consistency Validation", () => {
    it("should maintain consistent hover background color (red-50)", () => {
      // Arrange & Act
      renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      renderWithProviders(<StepCard step={mockStep} onDelete={vi.fn()} />);

      // Assert - Both should use hover:bg-red-50
      const blockButton = screen.getByTestId("delete-block-button");
      const stepButton = screen.getByTestId("delete-step-button");

      expect(blockButton).toHaveClass("hover:bg-red-50");
      expect(stepButton).toHaveClass("hover:bg-red-50");
    });

    it("should maintain consistent dark mode hover background (red-900/30)", () => {
      // Arrange & Act
      renderWithProviders(
        <RepetitionBlockHeaderRight
          block={mockBlock}
          onEditClick={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      renderWithProviders(<StepCard step={mockStep} onDelete={vi.fn()} />);

      // Assert - Both should use dark:hover:bg-red-900/30
      const blockButton = screen.getByTestId("delete-block-button");
      const stepButton = screen.getByTestId("delete-step-button");

      expect(blockButton).toHaveClass("dark:hover:bg-red-900/30");
      expect(stepButton).toHaveClass("dark:hover:bg-red-900/30");
    });
  });
});
