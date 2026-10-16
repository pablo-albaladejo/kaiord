import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyInformationSection } from "./PrivacyInformationSection";

describe("PrivacyInformationSection", () => {
  it("should name every connection, not just Garmin and Train2Go", () => {
    // Arrange
    const brands = [
      "Garmin",
      "Train2Go",
      "WHOOP",
      "Tanita",
      "TrainingPeaks",
      "intervals.icu",
    ];

    // Act
    render(<PrivacyInformationSection />);

    // Assert
    const text = screen.getByRole("list").textContent ?? "";
    for (const brand of brands) expect(text).toContain(brand);
  });
});
