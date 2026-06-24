import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ChatSearchResult } from "../../../application/chat/search-conversations";
import { ChatSearchResults } from "./ChatSearchResults";

const SNIPPET = "…el umbral hoy";
const MATCH_START = SNIPPET.indexOf("umbral");
const MATCH_END = MATCH_START + "umbral".length;

const result: ChatSearchResult = {
  conversationId: "c1",
  title: "Plan",
  titleMatch: false,
  messageMatches: [
    {
      messageId: "m1",
      role: "user",
      snippet: SNIPPET,
      ranges: [[MATCH_START, MATCH_END]],
    },
  ],
};

describe("ChatSearchResults", () => {
  it("should render the matched span inside a mark element", () => {
    // Arrange
    const props = { onSelect: vi.fn(), onResultSelect: vi.fn() };

    // Act
    render(<ChatSearchResults results={[result]} {...props} />);

    // Assert
    const mark = screen.getByText("umbral");
    expect(mark.tagName).toBe("MARK");
  });

  it("should call onResultSelect with conversation and message id", async () => {
    // Arrange
    const onResultSelect = vi.fn();
    render(
      <ChatSearchResults
        results={[result]}
        onSelect={vi.fn()}
        onResultSelect={onResultSelect}
      />
    );

    // Act
    await userEvent.click(screen.getByTestId("chat-search-result-m1"));

    // Assert
    expect(onResultSelect).toHaveBeenCalledWith("c1", "m1");
  });

  it("should call onSelect when the conversation title is clicked", async () => {
    // Arrange
    const onSelect = vi.fn();
    render(
      <ChatSearchResults
        results={[result]}
        onSelect={onSelect}
        onResultSelect={vi.fn()}
      />
    );

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Plan" }));

    // Assert
    expect(onSelect).toHaveBeenCalledWith("c1");
  });

  it("should show an empty state when there are no results", () => {
    // Arrange
    const props = { onSelect: vi.fn(), onResultSelect: vi.fn() };

    // Act
    render(<ChatSearchResults results={[]} {...props} />);

    // Assert
    expect(screen.getByTestId("chat-search-empty")).toBeInTheDocument();
  });
});
