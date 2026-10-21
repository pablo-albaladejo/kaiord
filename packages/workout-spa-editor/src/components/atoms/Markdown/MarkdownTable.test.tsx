import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "./Markdown";

describe("Markdown tables", () => {
  it("should render a wide table inside its own focusable scroll box", () => {
    // Arrange
    const columnCount = 12;
    const cols = Array.from(
      { length: columnCount },
      (_, i) => `Column ${i + 1}`
    );
    const source = [
      `| ${cols.join(" | ")} |`,
      `|${cols.map(() => "---").join("|")}|`,
      `| ${cols.map((_, i) => `**${i}**`).join(" | ")} |`,
    ].join("\n");

    // Act
    render(<Markdown source={source} />);

    // Assert
    const scroll = screen.getByTestId("markdown-table-scroll");
    expect(scroll).toHaveClass("overflow-x-auto", "max-w-full");
    expect(scroll).toHaveAttribute("tabIndex", "0");
    const table = within(scroll).getByRole("table");
    expect(within(table).getAllByRole("columnheader")).toHaveLength(
      columnCount
    );
    expect(within(table).getByText("11").tagName).toBe("STRONG");
  });

  it("should align cells and span a short row's last cell, not pad it", () => {
    // Arrange
    const source = "| L | C | R |\n|:--|:-:|--:|\n| a |";

    // Act
    render(<Markdown source={source} />);

    // Assert
    const headers = screen.getAllByRole("columnheader");
    expect(headers[1]).toHaveClass("text-center");
    expect(headers[2]).toHaveClass("text-right");
    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(1);
    expect(cells[0]).toHaveAttribute("colSpan", String(headers.length));
  });
});
