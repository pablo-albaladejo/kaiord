import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ClampedNotes } from "./coaching-dialog-notes";

const CLAMPED_HEIGHT = 40;
const FULL_HEIGHT = 120;

const stubBoxHeights = (scroll: number, client: number) => {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
    scroll
  );
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
    client
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ClampedNotes", () => {
  it("should clamp the notes to two lines by default", () => {
    // Arrange

    // Act
    render(<ClampedNotes>Warm up 10 min easy.</ClampedNotes>);

    // Assert
    expect(screen.getByTestId("coaching-dialog-notes")).toHaveClass(
      "line-clamp-2"
    );
  });

  it("should not offer a toggle when the notes fit in two lines", () => {
    // Arrange
    stubBoxHeights(CLAMPED_HEIGHT, CLAMPED_HEIGHT);

    // Act
    render(<ClampedNotes>Short note.</ClampedNotes>);

    // Assert
    expect(
      screen.queryByTestId("coaching-dialog-notes-toggle")
    ).not.toBeInTheDocument();
  });

  it("should expand and collapse overflowing notes with Show all / Show less", async () => {
    // Arrange
    stubBoxHeights(FULL_HEIGHT, CLAMPED_HEIGHT);
    const user = userEvent.setup();
    render(<ClampedNotes>Long coach notes.</ClampedNotes>);

    // Act
    await user.click(screen.getByRole("button", { name: "Show all" }));
    const expanded = screen.getByTestId("coaching-dialog-notes").className;
    await user.click(screen.getByRole("button", { name: "Show less" }));

    // Assert
    expect(expanded).not.toContain("line-clamp-2");
    expect(screen.getByTestId("coaching-dialog-notes")).toHaveClass(
      "line-clamp-2"
    );
    expect(screen.getByRole("button", { name: "Show all" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
});
