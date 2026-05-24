import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditorPageHeader } from "./EditorPageHeader";

describe("EditorPageHeader", () => {
  it("should NOT render a back button when onBack is undefined", () => {
    // Arrange

    // Act
    render(<EditorPageHeader mode="new" />);

    // Assert
    expect(screen.queryByTestId("editor-back-button")).toBeNull();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it('should render the back button with aria-label "Back" and testid "editor-back-button" when onBack is provided', () => {
    // Arrange
    const onBack = vi.fn();

    // Act
    render(<EditorPageHeader mode="new" onBack={onBack} />);

    // Assert
    const button = screen.getByTestId("editor-back-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Back");
    expect(button).toHaveAttribute("type", "button");
  });

  it("should fire the onBack callback on click", async () => {
    // Arrange
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<EditorPageHeader mode="new" onBack={onBack} />);

    // Act
    await user.click(screen.getByTestId("editor-back-button"));

    // Assert
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
