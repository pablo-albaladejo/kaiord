/**
 * Tests for the read-only day-comments panel: author + localized
 * timestamp + linkified body; hidden when empty; no compose/edit/delete
 * affordances.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CoachingDayComment } from "../../../types/coaching-day-notes-record";
import { CoachingDayComments } from "./CoachingDayComments";

const comment = (
  over: Partial<CoachingDayComment> = {}
): CoachingDayComment => ({
  author: "Daniel Blanco Galindo",
  isOwn: false,
  timestamp: "2026-06-08 13:02:21",
  text: "Me alegro Pablo",
  ...over,
});

describe("CoachingDayComments", () => {
  it("should render author, a timestamp and the comment body", () => {
    // Arrange
    const comments = [comment()];

    // Act
    render(<CoachingDayComments comments={comments} />);

    // Assert
    expect(screen.getByTestId("coaching-day-comments")).toBeInTheDocument();
    expect(screen.getByText("Daniel Blanco Galindo")).toBeInTheDocument();
    expect(screen.getByText("Me alegro Pablo")).toBeInTheDocument();
    // Raw platform timestamp preserved in the <time> dateTime attribute.
    const time = screen.getByText((_t, el) => el?.tagName === "TIME");
    expect(time).toHaveAttribute("dateTime", "2026-06-08 13:02:21");
  });

  it("should render a link in a comment body as a safe anchor", () => {
    // Arrange
    const comments = [
      comment({
        isOwn: true,
        text: "[connect.garmin.com](https://connect.garmin.com/app/activity/1)",
      }),
    ];

    // Act
    render(<CoachingDayComments comments={comments} />);

    // Assert
    const anchor = screen.getByRole("link", { name: "connect.garmin.com" });
    expect(anchor).toHaveAttribute(
      "href",
      "https://connect.garmin.com/app/activity/1"
    );
    expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
    expect(anchor).toHaveAttribute("target", "_blank");
  });

  it("should render nothing when there are no comments", () => {
    // Arrange
    const comments: CoachingDayComment[] = [];

    // Act
    const { container } = render(<CoachingDayComments comments={comments} />);

    // Assert
    expect(
      screen.queryByTestId("coaching-day-comments")
    ).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("should expose no compose, edit or delete affordances (read-only)", () => {
    // Arrange
    const comments = [comment(), comment({ isOwn: true, text: "mine" })];

    // Act
    render(<CoachingDayComments comments={comments} />);

    // Assert
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
