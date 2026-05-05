/**
 * EmptyLibrary tests.
 *
 * Two empty-state branches: (a) `isFiltered=true` shows a "no
 * results" message with an optional Clear Filters button, (b)
 * `isFiltered=false` shows a "library is empty" onboarding message
 * and never renders the Clear Filters button.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../test-utils";
import { EmptyLibrary } from "./EmptyLibrary";

describe("EmptyLibrary", () => {
  it("should render the empty-library onboarding message when not filtered", () => {
    // Arrange

    // Act
    render(<EmptyLibrary isFiltered={false} />);

    // Assert
    expect(screen.getByText("Your library is empty")).toBeInTheDocument();
    expect(
      screen.getByText(/Create your first workout/)
    ).toBeInTheDocument();
  });

  it("should not render the Clear Filters button when not filtered even if onClearFilters is provided", () => {
    // Arrange

    // Act
    render(<EmptyLibrary isFiltered={false} onClearFilters={vi.fn()} />);

    // Assert
    expect(
      screen.queryByRole("button", { name: /clear filters/i })
    ).not.toBeInTheDocument();
  });

  it("should render the no-results message when filtered", () => {
    // Arrange

    // Act
    render(<EmptyLibrary isFiltered onClearFilters={vi.fn()} />);

    // Assert
    expect(screen.getByText("No workouts found")).toBeInTheDocument();
    expect(
      screen.getByText(/No workouts match your current filters/)
    ).toBeInTheDocument();
  });

  it("should render the Clear Filters button when filtered and onClearFilters is provided", () => {
    // Arrange

    // Act
    render(<EmptyLibrary isFiltered onClearFilters={vi.fn()} />);

    // Assert
    expect(
      screen.getByRole("button", { name: /clear filters/i })
    ).toBeInTheDocument();
  });

  it("should not render the Clear Filters button when filtered and onClearFilters is omitted", () => {
    // Arrange

    // Act
    render(<EmptyLibrary isFiltered />);

    // Assert
    expect(
      screen.queryByRole("button", { name: /clear filters/i })
    ).not.toBeInTheDocument();
  });

  it("should call onClearFilters when the Clear Filters button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(<EmptyLibrary isFiltered onClearFilters={onClearFilters} />);

    // Act
    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    // Assert
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
