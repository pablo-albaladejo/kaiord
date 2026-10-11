import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { LibraryEmpty } from "./LibraryEmpty";

const renderAt = (isFiltered: boolean) => {
  const loc = memoryLocation({ path: "/library", record: true });
  render(
    <Router hook={loc.hook}>
      <LibraryEmpty isFiltered={isFiltered} />
    </Router>
  );
  return loc;
};

describe("LibraryEmpty", () => {
  it("should open the new session sheet from the empty library", async () => {
    // Arrange
    const loc = renderAt(false);

    // Act
    await userEvent.click(screen.getByRole("button", { name: "New workout" }));

    // Assert
    expect(loc.history.at(-1)).toBe("/workout/new");
  });

  it("should open the file import from the empty library", async () => {
    // Arrange
    const loc = renderAt(false);

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Import file" }));

    // Assert
    expect(loc.history.at(-1)).toBe("/workout/new?action=import");
  });

  it("should offer no create actions when only the filters are empty", () => {
    // Arrange
    renderAt(true);

    // Act
    const buttons = screen.queryAllByRole("button");

    // Assert
    expect(buttons).toHaveLength(0);
  });
});
