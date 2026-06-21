import { describe, expect, it } from "vitest";

import {
  deriveConversationTitle,
  FALLBACK_CONVERSATION_TITLE,
  MAX_CONVERSATION_TITLE_LENGTH,
} from "./derive-conversation-title";

describe("deriveConversationTitle", () => {
  it("should use the trimmed message when within the bound", () => {
    // Arrange
    const message = "  Plan my week  ";

    // Act
    const title = deriveConversationTitle(message);

    // Assert
    expect(title).toBe("Plan my week");
  });

  it("should collapse internal whitespace runs", () => {
    // Arrange
    const message = "Plan\n\tmy   week";

    // Act
    const title = deriveConversationTitle(message);

    // Assert
    expect(title).toBe("Plan my week");
  });

  it("should truncate with an ellipsis when over the bound", () => {
    // Arrange
    const message = "a".repeat(MAX_CONVERSATION_TITLE_LENGTH + 1);

    // Act
    const title = deriveConversationTitle(message);

    // Assert
    expect(title).toHaveLength(MAX_CONVERSATION_TITLE_LENGTH);
    expect(title.endsWith("…")).toBe(true);
  });

  it("should fall back to a stable title for an empty message", () => {
    // Arrange
    const message = "   \n  ";

    // Act
    const title = deriveConversationTitle(message);

    // Assert
    expect(title).toBe(FALLBACK_CONVERSATION_TITLE);
  });
});
