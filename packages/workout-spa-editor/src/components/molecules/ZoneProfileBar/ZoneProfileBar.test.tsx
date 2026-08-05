import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ZoneSegment } from "../../../lib/workout-review";
import { ZoneProfileBar } from "./ZoneProfileBar";

const SECONDS = 600;
const EASY_ZONE = 2;
const HARD_ZONE = 4;
const GRID_HEIGHT = 14;
const LIST_HEIGHT = 20;

const SEGMENTS: ZoneSegment[] = [
  { zone: EASY_ZONE, seconds: SECONDS },
  { zone: HARD_ZONE, seconds: SECONDS },
  { zone: 1, seconds: SECONDS },
];

describe("ZoneProfileBar", () => {
  it("should render one bar per segment", () => {
    // Arrange

    // Act
    render(<ZoneProfileBar segments={SEGMENTS} />);

    // Assert
    expect(screen.getByTestId("zone-profile-bar").children).toHaveLength(
      SEGMENTS.length
    );
  });

  it("should make the harder zone the taller bar, so the ramp reads without colour", () => {
    // Arrange
    render(<ZoneProfileBar segments={SEGMENTS} />);

    // Act
    const bars = Array.from(screen.getByTestId("zone-profile-bar").children);
    const heightOf = (zone: number) =>
      parseFloat(
        (
          bars.find((b) => b.getAttribute("data-zone") === String(zone)) as
            HTMLElement | undefined
        )?.style.height ?? "0"
      );

    // Assert
    expect(heightOf(HARD_ZONE)).toBeGreaterThan(heightOf(EASY_ZONE));
    expect(heightOf(EASY_ZONE)).toBeGreaterThan(heightOf(1));
  });

  it("should weight each bar by its duration", () => {
    // Arrange
    const uneven: ZoneSegment[] = [
      { zone: 1, seconds: SECONDS },
      { zone: HARD_ZONE, seconds: SECONDS * 2 },
    ];

    // Act
    render(<ZoneProfileBar segments={uneven} />);

    // Assert
    const bars = Array.from(screen.getByTestId("zone-profile-bar").children);
    expect((bars[0] as HTMLElement).style.flexGrow).toBe(String(SECONDS));
    expect((bars[1] as HTMLElement).style.flexGrow).toBe(String(SECONDS * 2));
  });

  it("should take the height the caller asks for", () => {
    // Arrange

    // Act
    const { rerender } = render(
      <ZoneProfileBar segments={SEGMENTS} height={GRID_HEIGHT} />
    );
    const grid = screen.getByTestId("zone-profile-bar").style.height;
    rerender(<ZoneProfileBar segments={SEGMENTS} height={LIST_HEIGHT} />);
    const list = screen.getByTestId("zone-profile-bar").style.height;

    // Assert
    expect(grid).toBe(`${GRID_HEIGHT}px`);
    expect(list).toBe(`${LIST_HEIGHT}px`);
  });

  it("should render nothing for a session with no classifiable structure", () => {
    // Arrange

    // Act
    render(<ZoneProfileBar segments={[]} />);

    // Assert
    expect(screen.queryByTestId("zone-profile-bar")).not.toBeInTheDocument();
  });

  it("should stay decorative unless it is given a label", () => {
    // Arrange

    // Act
    render(<ZoneProfileBar segments={SEGMENTS} />);

    // Assert
    expect(screen.getByTestId("zone-profile-bar")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });
});
