/**
 * LibraryFilters tests.
 *
 * Container component composing the search input, sport / difficulty
 * dropdowns, sort-by / sort-order dropdowns, and a Clear Filters
 * button. The test surface verifies (a) every controlled value is
 * forwarded to the matching subcomponent, (b) every change handler
 * fires with the expected next value, (c) the Clear Filters button
 * fires its handler.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../test-utils";
import { LibraryFilters } from "./LibraryFilters";

type Difficulty = "easy" | "medium" | "hard";
type Sport = "cycling" | "running" | "swimming" | "generic";

type Handlers = {
  onSearchChange: ReturnType<typeof vi.fn>;
  onSportFilterChange: ReturnType<typeof vi.fn>;
  onDifficultyFilterChange: ReturnType<typeof vi.fn>;
  onSortByChange: ReturnType<typeof vi.fn>;
  onSortOrderChange: ReturnType<typeof vi.fn>;
  onClearFilters: ReturnType<typeof vi.fn>;
};

function makeHandlers(): Handlers {
  return {
    onSearchChange: vi.fn(),
    onSportFilterChange: vi.fn(),
    onDifficultyFilterChange: vi.fn(),
    onSortByChange: vi.fn(),
    onSortOrderChange: vi.fn(),
    onClearFilters: vi.fn(),
  };
}

function renderFilters(
  overrides: Partial<{
    searchTerm: string;
    sportFilter: Sport | "all";
    difficultyFilter: Difficulty | "all";
    sortBy: "name" | "date" | "difficulty";
    sortOrder: "asc" | "desc";
  }> = {},
  handlers: Handlers = makeHandlers()
) {
  const props = {
    searchTerm: overrides.searchTerm ?? "",
    sportFilter: overrides.sportFilter ?? ("all" as const),
    difficultyFilter: overrides.difficultyFilter ?? ("all" as const),
    sortBy: overrides.sortBy ?? ("name" as const),
    sortOrder: overrides.sortOrder ?? ("asc" as const),
    ...handlers,
  };
  render(<LibraryFilters {...props} />);
  return handlers;
}

describe("LibraryFilters", () => {
  it("should render every filter sub-control and the Clear Filters button", () => {
    // Arrange

    // Act
    renderFilters();

    // Assert
    expect(
      screen.getByPlaceholderText("Search workouts...")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Sport")).toBeInTheDocument();
    expect(screen.getByLabelText("Difficulty")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort By")).toBeInTheDocument();
    expect(screen.getByLabelText("Order")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /clear filters/i })
    ).toBeInTheDocument();
  });

  it("should reflect the controlled searchTerm in the search input", () => {
    // Arrange

    // Act
    renderFilters({ searchTerm: "intervals" });

    // Assert
    expect(screen.getByPlaceholderText("Search workouts...")).toHaveValue(
      "intervals"
    );
  });

  it("should fire onSearchChange with the next value when the search input changes", async () => {
    // Arrange
    const user = userEvent.setup();
    const handlers = renderFilters();

    // Act
    await user.type(screen.getByPlaceholderText("Search workouts..."), "x");

    // Assert
    expect(handlers.onSearchChange).toHaveBeenCalledWith("x");
  });

  it("should fire onSportFilterChange with the picked sport", async () => {
    // Arrange
    const user = userEvent.setup();
    const handlers = renderFilters();

    // Act
    await user.selectOptions(screen.getByLabelText("Sport"), "cycling");

    // Assert
    expect(handlers.onSportFilterChange).toHaveBeenCalledWith("cycling");
  });

  it("should fire onDifficultyFilterChange with the picked difficulty", async () => {
    // Arrange
    const user = userEvent.setup();
    const handlers = renderFilters();

    // Act
    await user.selectOptions(screen.getByLabelText("Difficulty"), "hard");

    // Assert
    expect(handlers.onDifficultyFilterChange).toHaveBeenCalledWith("hard");
  });

  it("should fire onSortByChange with the picked sort key", async () => {
    // Arrange
    const user = userEvent.setup();
    const handlers = renderFilters();

    // Act
    await user.selectOptions(screen.getByLabelText("Sort By"), "date");

    // Assert
    expect(handlers.onSortByChange).toHaveBeenCalledWith("date");
  });

  it("should fire onSortOrderChange with the picked order", async () => {
    // Arrange
    const user = userEvent.setup();
    const handlers = renderFilters();

    // Act
    await user.selectOptions(screen.getByLabelText("Order"), "desc");

    // Assert
    expect(handlers.onSortOrderChange).toHaveBeenCalledWith("desc");
  });

  it("should fire onClearFilters when the Clear Filters button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const handlers = renderFilters();

    // Act
    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    // Assert
    expect(handlers.onClearFilters).toHaveBeenCalledTimes(1);
  });
});
