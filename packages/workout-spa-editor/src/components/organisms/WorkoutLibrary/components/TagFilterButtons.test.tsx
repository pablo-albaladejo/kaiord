/**
 * TagFilterButtons tests.
 *
 * Renders one toggle button per tag with `aria-pressed` reflecting
 * membership in `selectedTags`. Empty `allTags` short-circuits to
 * null. Click events fire `onTagToggle(tag)` for the clicked tag.
 */

import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../../test-utils";
import { TagFilterButtons } from "./TagFilterButtons";

describe("TagFilterButtons", () => {
  it("should render nothing when allTags is empty", () => {
    // Arrange

    // Act
    const { container } = render(
      <TagFilterButtons
        allTags={[]}
        selectedTags={[]}
        onTagToggle={vi.fn()}
      />
    );

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("should render the Tags label and one button per tag when allTags is non-empty", () => {
    // Arrange

    // Act
    render(
      <TagFilterButtons
        allTags={["fast", "easy"]}
        selectedTags={[]}
        onTagToggle={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByText("Tags:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "fast" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "easy" })).toBeInTheDocument();
  });

  it("should mark only the selected tags with aria-pressed=true", () => {
    // Arrange

    // Act
    render(
      <TagFilterButtons
        allTags={["fast", "easy", "hills"]}
        selectedTags={["easy"]}
        onTagToggle={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByRole("button", { name: "fast" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByRole("button", { name: "easy" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "hills" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("should call onTagToggle with the clicked tag", async () => {
    // Arrange
    const user = userEvent.setup();
    const onTagToggle = vi.fn();
    render(
      <TagFilterButtons
        allTags={["fast", "easy"]}
        selectedTags={[]}
        onTagToggle={onTagToggle}
      />
    );

    // Act
    await user.click(screen.getByRole("button", { name: "fast" }));

    // Assert
    expect(onTagToggle).toHaveBeenCalledWith("fast");
    expect(onTagToggle).toHaveBeenCalledTimes(1);
  });
});
