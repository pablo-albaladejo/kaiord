import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { WorkoutActions } from "./WorkoutActions";

/**
 * The capitalization property changed with the verb cut. Title Case was the
 * old convention ("Save Workout", "Save to Library"); the three verbs are
 * written as sentences — "Keep in library", "Download a file" — so only the
 * first word is capitalized, and a mid-label capital now signals a proper
 * noun (Garmin) rather than a style.
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

  const defaultProps = { krd: mockKRD, onDiscard: () => {} };

  const PROPER_NOUNS = ["Garmin", "FIT", "TCX", "ZWO", "KRD", "AI"];

  it("should start every button label with a capital", () => {
    // Arrange
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Act
    const firstChars = screen
      .getAllByRole("button")
      .map((b) => (b.textContent ?? "").trim())
      .filter((text) => text.length > 0)
      .map((text) => text[0]);

    // Assert
    firstChars.forEach((char) => expect(char).toMatch(/[A-Z]/));
  });

  it("should keep every word after the first lowercase unless it is a proper noun", () => {
    // Arrange
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Act
    const tailWords = screen
      .getAllByRole("button")
      .map((b) => (b.textContent ?? "").trim())
      .flatMap((text) => text.split(/\s+/).slice(1))
      .filter((word) => word.length > 0 && !PROPER_NOUNS.includes(word));

    // Assert
    tailWords.forEach((word) => expect(word[0]).toMatch(/[a-z]/));
  });

  it.each([
    { label: "Keep in library" },
    { label: "Download a file" },
    { label: "Discard workout" },
  ])("should render $label verbatim", ({ label }) => {
    // Arrange
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Act
    const labels = screen
      .getAllByRole("button")
      .map((b) => (b.textContent ?? "").trim());

    // Assert
    expect(labels.some((text) => text.includes(label))).toBe(true);
  });

  it("should wrap rather than overflow on a narrow viewport", () => {
    // Arrange
    renderWithProviders(<WorkoutActions {...defaultProps} />);

    // Act
    const container = screen.getByTestId(
      "discard-workout-button"
    ).parentElement;

    // Assert
    expect(container).toHaveClass("flex-wrap");
    expect(container).toHaveClass("gap-2.5");
  });
});
