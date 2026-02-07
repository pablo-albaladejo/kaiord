import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { WorkoutActions } from "./WorkoutActions";

/**
 * Feature: workout-spa-editor/09-repetition-blocks-and-ui-polish, Property 11: Button capitalization consistency
 * Validates: Requirements 5.7
 */
describe("WorkoutActions - Property Tests", () => {
  const mockKRD: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      structured_workout: {
        name: "Test Workout",
        sport: "cycling",
        steps: [],
      },
    },
  };

  const defaultProps = {
    krd: mockKRD,
    canUndo: false,
    canRedo: false,
    onUndo: () => {},
    onRedo: () => {},
    onDiscard: () => {},
  };

  /**
   * Property 11: Button capitalization consistency
   * For all button labels in the metadata section, the text should follow title case capitalization
   * (first letter of major words capitalized, minor words like "to" lowercase)
   */
  it("should use title case for all button labels", () => {
    // Arrange & Act
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Assert
    const buttons = screen.getAllByRole("button");

    // Define expected button labels in title case
    const expectedLabels = [
      "Save Workout",
      "Save to Library",
      "Discard Workout",
    ];

    // Minor words that should be lowercase in title case (except when first word)
    const minorWords = [
      "to",
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "for",
      "of",
      "in",
      "on",
      "at",
    ];

    // Check that all buttons have title case labels
    buttons.forEach((button) => {
      const text = button.textContent || "";
      const trimmedText = text.trim();

      // Check if this button matches one of our expected labels
      const matchesExpected = expectedLabels.some((label) =>
        trimmedText.includes(label)
      );

      if (matchesExpected) {
        // Verify it follows title case pattern
        // Title case: first letter of major words capitalized, minor words lowercase
        const words = trimmedText.split(/\s+/);
        words.forEach((word, index) => {
          if (word.length > 0) {
            const lowerWord = word.toLowerCase();
            const firstChar = word[0];

            if (firstChar) {
              // First word should always be capitalized
              if (index === 0) {
                expect(firstChar).toMatch(/[A-Z]/);
              } else if (minorWords.includes(lowerWord)) {
                // Minor words should be lowercase (unless first word)
                expect(firstChar).toMatch(/[a-z]/);
              } else {
                // Major words should be capitalized
                expect(firstChar).toMatch(/[A-Z]/);
              }
            }
          }
        });
      }
    });
  });

  /**
   * Additional test: Verify specific button labels are in title case
   */
  it("should have 'Save Workout' button in title case", () => {
    // Arrange & Act
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Assert
    const saveButton = screen.getByRole("button", { name: /save workout/i });
    expect(saveButton.textContent).toContain("Save Workout");
  });

  it("should have 'Save to Library' button in title case", () => {
    // Arrange & Act
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Assert
    const libraryButton = screen.getByRole("button", {
      name: /save to library/i,
    });
    expect(libraryButton.textContent).toContain("Save to Library");
  });

  it("should have 'Discard Workout' button in title case", () => {
    // Arrange & Act
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Assert
    const discardButton = screen.getByRole("button", {
      name: /discard workout/i,
    });
    expect(discardButton.textContent).toContain("Discard Workout");
  });

  /**
   * Property 12: Responsive button layout
   * For any viewport width, buttons in the metadata section should either display horizontally
   * with proper spacing (desktop) or stack vertically (mobile) without overflow
   */
  it("should have responsive layout classes for mobile and desktop", () => {
    // Arrange & Act
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Assert
    const discardButton = screen.getByTestId("discard-workout-button");
    const outerContainer = discardButton.parentElement;
    const buttonRow = outerContainer?.firstElementChild;

    // Verify responsive classes are present
    // Mobile: flex-col (stack vertically)
    expect(buttonRow).toHaveClass("flex-col");

    // Desktop: sm:flex-row (horizontal layout)
    expect(buttonRow).toHaveClass("sm:flex-row");

    // Proper spacing
    expect(buttonRow).toHaveClass("gap-3");

    // Full width on mobile, auto width on desktop
    expect(buttonRow).toHaveClass("w-full");
    expect(buttonRow).toHaveClass("sm:w-auto");
  });

  it("should have full width buttons on mobile", () => {
    // Arrange & Act
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Assert
    const discardButton = screen.getByTestId("discard-workout-button");

    // Buttons should be full width on mobile
    expect(discardButton).toHaveClass("w-full");

    // But auto width on desktop
    expect(discardButton).toHaveClass("sm:w-auto");
  });
});
