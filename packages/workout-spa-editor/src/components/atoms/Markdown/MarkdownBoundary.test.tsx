import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Markdown } from "./Markdown";

vi.mock("./parse-blocks", () => ({
  parseBlocks: (source: string) => {
    if (source.includes("boom")) throw new RangeError("too deep");
    return [{ kind: "paragraph", text: source }];
  },
}));

describe("MarkdownBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should fall back to plain text when rendering throws", () => {
    // Arrange
    const source = "**boom** <b>x</b>";

    // Act
    render(<Markdown source={source} />);

    // Assert
    expect(screen.getByText(source).tagName).toBe("P");
    expect(document.querySelector("strong, b")).toBeNull();
  });

  it("should try markdown again when the source changes", () => {
    // Arrange
    const { rerender } = render(<Markdown source="boom" />);

    // Act
    rerender(<Markdown source="fine now" />);

    // Assert
    expect(screen.getByText("fine now")).toBeInTheDocument();
    expect(screen.queryByText("boom")).toBeNull();
  });

  it("should report a message that keeps failing only once", () => {
    // Arrange
    const { rerender } = render(<Markdown source="boom 1" />);

    // Act
    rerender(<Markdown source="boom 12" />);
    rerender(<Markdown source="boom 123" />);

    // Assert
    const reports = consoleErrorSpy.mock.calls.filter(
      ([message]) =>
        message === "Chat markdown failed to render; showing plain text"
    );
    expect(reports).toHaveLength(1);
    expect(screen.getByText("boom 123").tagName).toBe("P");
  });
});
