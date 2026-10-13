import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { appI18n, setActiveLocale } from "../../../../i18n/i18n";
import { SportZoneThresholds } from "./SportZoneThresholds";

vi.mock("../../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => "es",
}));

describe("SportZoneThresholds in Spanish", () => {
  beforeAll(() => setActiveLocale("es"));
  afterAll(() => appI18n.changeLanguage("en"));

  it("should label the LTHR threshold with ppm, not bpm", () => {
    // Arrange
    const onChange = vi.fn();

    // Act
    const { container } = render(
      <SportZoneThresholds
        thresholds={{ lthr: 168 }}
        capabilities={{ hr: true, power: false, pace: false }}
        onChange={onChange}
      />
    );

    // Assert
    expect(screen.getByText("ppm")).toBeInTheDocument();
    expect(container.textContent).not.toContain("bpm");
  });
});
