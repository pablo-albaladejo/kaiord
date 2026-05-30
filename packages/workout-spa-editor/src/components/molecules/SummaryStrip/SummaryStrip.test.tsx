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
