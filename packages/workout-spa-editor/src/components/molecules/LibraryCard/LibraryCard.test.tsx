import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LibraryCard } from "./LibraryCard";

const DIST = [2, 1, 2, 1, 1];
/* Weights, not fractions: LibraryCard only asks which is largest. */
const DIST_Z3_DOMINANT = [1, 2, 100, 1, 0];

describe("LibraryCard", () => {
  it("should render the title", () => {
    // Arrange
    render(
      <LibraryCard title="Sweet Spot" sportLabel="Cycling" onClick={vi.fn()} />
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
        sportLabel="Cycling"
        duration="1:00:00"
        tss={78}
        onClick={vi.fn()}
      />
    );

    // Act
    const meta = screen.getByText(/78 TSS/);

    // Assert
    expect(meta).toHaveTextContent("Cycling · 1:00:00 · 78 TSS");
  });

  it("should render an optional tag pill", () => {
    // Arrange
    render(
      <LibraryCard
        title="Sweet Spot"
        sportLabel="Cycling"
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
        sportLabel="Cycling"
        dist={DIST}
        onClick={vi.fn()}
      />
    );

    // Act
    const bars = container.querySelectorAll("[style*='flex']");

    // Assert
    expect(bars.length).toBeGreaterThan(0);
  });

  it("should carry a lateral border in the dominant zone", () => {
    // Arrange
    render(
      <LibraryCard
        title="Sweet Spot"
        sportLabel="Cycling"
        dist={DIST_Z3_DOMINANT}
        onClick={vi.fn()}
      />
    );

    // Act
    const card = screen.getByTestId("library-card");

    // Assert
    expect(card.getAttribute("style")).toContain(
      "border-left: 4px solid var(--zone-3)"
    );
  });

  it("should carry no zone border when there is no distribution", () => {
    // Arrange
    render(
      <LibraryCard title="Sweet Spot" sportLabel="Cycling" onClick={vi.fn()} />
    );

    // Act
    const card = screen.getByTestId("library-card");

    // Assert
    expect(card.style.borderLeft).toBe("");
  });

  it("should call onClick when the card is tapped", async () => {
    // Arrange
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <LibraryCard title="Sweet Spot" sportLabel="Cycling" onClick={onClick} />
    );

    // Act
    await user.click(screen.getByTestId("library-card"));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
