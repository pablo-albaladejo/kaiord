import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "./Markdown";

describe("Markdown links", () => {
  it.each(["https://garmin.com@evil.com/login", "https://user:pass@evil.com/"])(
    "should refuse a link with credentials: %s",
    (href) => {
      // Arrange
      const source = `[Reconnect Garmin](${href})`;

      // Act
      const { container } = render(<Markdown source={source} />);

      // Assert
      expect(container.querySelector("a")).toBeNull();
      expect(screen.getByText("Reconnect Garmin")).toBeInTheDocument();
    }
  );

  it("should show the host beside a label that does not name it", () => {
    // Arrange
    const source = "[Reconnect Garmin](https://evil.com/garmin)";

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(
      screen.getByRole("link", { name: "Reconnect Garmin" })
    ).toBeVisible();
    expect(container.textContent).toBe("Reconnect Garmin (evil.com)");
  });

  it.each([
    ["kaiord.com", "https://kaiord.com"],
    ["www.kaiord.com/docs", "https://www.kaiord.com/docs"],
    ["https://kaiord.com/a", "https://kaiord.com/a"],
  ])("should not repeat the host when the label %s names it", (label, href) => {
    // Arrange
    const source = `[${label}](${href})`;

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(container.textContent).toBe(label);
  });

  it("should accept a title and balanced parens in the destination", () => {
    // Arrange
    const source =
      '[Wiki](https://en.wikipedia.org/wiki/Fartlek_(training) "Fartlek") and https://x.dev/a_(b).';

    // Act
    render(<Markdown source={source} />);

    // Assert
    expect(screen.getByRole("link", { name: "Wiki" })).toHaveAttribute(
      "href",
      "https://en.wikipedia.org/wiki/Fartlek_(training)"
    );
    expect(
      screen.getByRole("link", { name: "https://x.dev/a_(b)" })
    ).toHaveAttribute("href", "https://x.dev/a_(b)");
  });

  it("should show the punycode host beside a look-alike bare URL", () => {
    // Arrange
    const source = "https://p\u0430ypal.com/login";

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(container.textContent).toBe(`${source} (xn--pypal-4ve.com)`);
  });

  it("should not repeat the host after a plain bare URL", () => {
    // Arrange
    const source = "https://kaiord.com/docs";

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(container.textContent).toBe(source);
  });
});
