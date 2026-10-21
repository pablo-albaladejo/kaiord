import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "./Markdown";

describe("Markdown", () => {
  it("should render paragraphs, bold, italic and inline code", () => {
    // Arrange
    const source = "First **bold** and *italic* and `code`.\n\nSecond _para_.";

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(container.querySelectorAll("p")).toHaveLength(2);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
    expect(screen.getByText("para").tagName).toBe("EM");
    expect(screen.getByText("code").tagName).toBe("CODE");
  });

  it("should render unordered, ordered and nested lists", () => {
    // Arrange
    const source = "- one\n- two\n  - nested\n\n3. three\n4. four";

    // Act
    render(<Markdown source={source} />);

    // Assert
    const lists = screen.getAllByRole("list");
    expect(lists.map((l) => l.tagName)).toEqual(["UL", "UL", "OL"]);
    expect(within(lists[1]).getByText("nested")).toBeInTheDocument();
    expect(lists[2]).toHaveAttribute("start", "3");
    expect(within(lists[2]).getAllByRole("listitem")).toHaveLength(2);
  });

  it("should render a fenced code block verbatim", () => {
    // Arrange
    const source = "```ts\nconst a = **1**;\n```";

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    const pre = container.querySelector("pre code");
    expect(pre?.textContent).toBe("const a = **1**;");
    expect(container.querySelector("strong")).toBeNull();
  });

  it("should render headings as bold lines, quotes and rules", () => {
    // Arrange
    const source = "## Plan\n\n> quoted **text**\n\n---";

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(screen.getByText("Plan")).toHaveClass("font-semibold");
    expect(container.querySelector("h2")).toBeNull();
    expect(container.querySelector("blockquote strong")?.textContent).toBe(
      "text"
    );
    expect(container.querySelector("hr")).not.toBeNull();
  });

  it("should render http(s) links in a new tab with rel=noopener", () => {
    // Arrange
    const source = "See [docs](https://kaiord.com/a) or https://x.dev/b.";

    // Act
    render(<Markdown source={source} />);

    // Assert
    const docs = screen.getByRole("link", { name: "docs" });
    expect(docs).toHaveAttribute("href", "https://kaiord.com/a");
    expect(docs).toHaveAttribute("target", "_blank");
    expect(docs.getAttribute("rel")).toContain("noopener");
    const bare = screen.getByRole("link", { name: "https://x.dev/b" });
    expect(bare).toHaveAttribute("href", "https://x.dev/b");
  });
});
