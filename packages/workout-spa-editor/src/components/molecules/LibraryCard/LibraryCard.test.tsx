import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LibraryCard } from "./LibraryCard";

const DIST = [2, 1, 2, 1, 1];

describe("LibraryCard", () => {
  it("should render the title", () => {
    // Arrange
    render(
      <LibraryCard title="Sweet Spot" sport="cycling" onClick={vi.fn()} />
    );

    // Act
    const title = screen.getByText("Sweet Spot");

    // Assert
    expect(title).toBeInTheDocument();
  });

  it("should render duration and TSS in the meta row", () => {
    // Arrange
    render(
      <LibraryCard
        title="Sweet Spot"
        sport="cycling"
        duration="1:00:00"
        tss={78}
        onClick={vi.fn()}
      />
    );

    // Act
    const meta = screen.getByText(/78 TSS/);

    // Assert
    expect(screen.getByText("1:00:00")).toBeInTheDocument();
    expect(meta).toBeInTheDocument();
  });

  it("should render an optional tag pill", () => {
    // Arrange
    render(
      <LibraryCard
        title="Sweet Spot"
        sport="cycling"
        tag="Threshold"
        onClick={vi.fn()}
      />
    );

    // Act
    const tag = screen.getByText("Threshold");

    // Assert
    expect(tag).toBeInTheDocument();
  });

  it("should render the zone distribution when dist is provided", () => {
    // Arrange
    const { container } = render(
      <LibraryCard
        title="Sweet Spot"
        sport="cycling"
        dist={DIST}
        onClick={vi.fn()}
      />
    );

    // Act
    const bars = container.querySelectorAll("[style*='flex']");

    // Assert
    expect(bars.length).toBeGreaterThan(0);
  });

  it("should call onClick when the card is tapped", async () => {
    // Arrange
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <LibraryCard title="Sweet Spot" sport="cycling" onClick={onClick} />
    );

    // Act
    await user.click(screen.getByTestId("library-card"));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
