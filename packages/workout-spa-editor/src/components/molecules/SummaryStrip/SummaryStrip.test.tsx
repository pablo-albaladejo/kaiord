import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SummaryItem } from "./SummaryStrip";
import { SummaryStrip } from "./SummaryStrip";

const items: SummaryItem[] = [
  { icon: "clock", value: "1:02:00", label: "Duration" },
  { icon: "zap", value: "85", label: "TSS" },
  { icon: "flame", value: "High", label: "Load" },
];

describe("SummaryStrip", () => {
  it("should render all items values and labels", () => {
    // Arrange

    render(<SummaryStrip items={items} />);

    // Act

    const duration = screen.getByText("1:02:00");
    const tss = screen.getByText("85");
    const load = screen.getByText("High");

    // Assert

    expect(duration).toBeInTheDocument();
    expect(tss).toBeInTheDocument();
    expect(load).toBeInTheDocument();
    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.getByText("TSS")).toBeInTheDocument();
    expect(screen.getByText("Load")).toBeInTheDocument();
  });

  it("should render one svg icon per item", () => {
    // Arrange

    const { container } = render(<SummaryStrip items={items} />);

    // Act

    const svgs = container.querySelectorAll("svg");

    // Assert

    expect(svgs).toHaveLength(items.length);
  });

  it("should replace the icon with a swatch when the item names a zone", () => {
    // Arrange

    const zoneItems: SummaryItem[] = [
      { icon: "flame", value: "Threshold", label: "Hardest zone", zone: 4 },
    ];

    // Act

    const { container } = render(<SummaryStrip items={zoneItems} />);

    // Assert

    expect(container.querySelectorAll("svg")).toHaveLength(0);
    expect(
      screen.getByTestId("summary-zone-swatch").getAttribute("style")
    ).toContain("var(--zone-4)");
    expect(screen.getByText("Threshold")).toBeInTheDocument();
    expect(screen.getByText("Hardest zone")).toBeInTheDocument();
  });

  it("should apply custom className to the root element", () => {
    // Arrange

    const { container } = render(
      <SummaryStrip items={items} className="my-custom-class" />
    );

    // Act

    const root = container.firstChild as HTMLElement;

    // Assert

    expect(root).toHaveClass("my-custom-class");
  });
});
