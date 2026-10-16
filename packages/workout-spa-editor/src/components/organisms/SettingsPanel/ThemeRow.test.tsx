import { afterEach, describe, expect, it } from "vitest";

import { renderWithProviders, screen, userEvent } from "../../../test-utils";
import { ThemeRow } from "./ThemeRow";

describe("ThemeRow", () => {
  afterEach(() => localStorage.clear());

  it("should apply and remember the theme picked in Settings", async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<ThemeRow />, { defaultTheme: "light" });

    // Act
    await user.click(screen.getByRole("radio", { name: "Dark" }));

    // Assert
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(localStorage.getItem("workout-editor-theme")).toBe("dark");
  });
});
