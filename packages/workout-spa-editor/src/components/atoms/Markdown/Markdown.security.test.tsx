import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "./Markdown";

describe("Markdown safety", () => {
  it("should escape a script tag as text instead of creating an element", () => {
    // Arrange
    const source = "<script>window.pwned = 1</script>";

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain(
      "<script>window.pwned = 1</script>"
    );
  });

  it("should escape raw HTML with event handlers", () => {
    // Arrange
    const source = 'Hi <img src=x onerror="alert(1)"> <b>bold</b>';

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
  });

  it.each([
    "javascript:alert%281%29",
    "JaVaScRiPt:alert%281%29",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox",
    "/relative/path",
  ])("should render a %s link as plain text with no anchor", (href) => {
    // Arrange
    const source = `[click me](${href})`;

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("click me")).toBeInTheDocument();
  });

  it("should escape HTML inside table cells and code", () => {
    // Arrange
    const source = "| a |\n|---|\n| <iframe src=x> |\n\n`<svg onload=x>`";

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByText("<iframe src=x>").tagName).toBe("TD");
  });
});
