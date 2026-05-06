/**
 * CardTags tests.
 *
 * Renders up to three tag badges plus a "+N" overflow badge when more
 * than three tags are supplied. The empty-array branch returns null
 * (renders nothing).
 */

import { describe, expect, it } from "vitest";

import { render, screen } from "../../../../test-utils";
import { CardTags } from "./CardTags";

describe("CardTags", () => {
  it("should render nothing when the tag list is empty", () => {
    // Arrange

    // Act
    const { container } = render(<CardTags tags={[]} />);

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("should render every tag when there are three or fewer", () => {
    // Arrange

    // Act
    render(<CardTags tags={["fast", "easy", "hills"]} />);

    // Assert
    expect(screen.getByText("fast")).toBeInTheDocument();
    expect(screen.getByText("easy")).toBeInTheDocument();
    expect(screen.getByText("hills")).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it("should render only the first three tags plus an overflow badge when there are more", () => {
    // Arrange

    // Act
    render(<CardTags tags={["a", "b", "c", "d", "e"]} />);

    // Assert
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();
    expect(screen.queryByText("d")).not.toBeInTheDocument();
    expect(screen.queryByText("e")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
