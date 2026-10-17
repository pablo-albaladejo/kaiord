import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";
import { ChatConversation } from "./ChatConversation";

const send = vi.fn();

vi.mock("../../../hooks/use-chat-turn", () => ({
  useChatTurn: () => ({
    state: "idle",
    streamingText: "",
    pendingAction: null,
    error: null,
    send,
    approve: vi.fn(),
    deny: vi.fn(),
    retry: vi.fn(),
  }),
}));

const message: ChatMessageRecord = {
  id: "m1",
  profileId: "p1",
  conversationId: "c1",
  role: "assistant",
  content: "Hi",
  createdAt: "2026-10-17T10:00:00.000Z",
};

const renderConversation = (messages: ChatMessageRecord[]) =>
  render(
    <ChatConversation
      profileId="p1"
      conversationId="c1"
      provider={null}
      modelId={null}
      pinModel={false}
      generationProvider={null}
      generationModelId={null}
      messages={messages}
    />
  );

describe("ChatConversation capabilities", () => {
  beforeEach(() => {
    send.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("should show the grouped catalog when the conversation is empty", () => {
    // Arrange
    const messages: ChatMessageRecord[] = [];

    // Act
    renderConversation(messages);

    // Assert
    const catalog = screen.getByTestId("chat-capabilities");
    expect(catalog).toHaveTextContent("Look up");
    expect(catalog).toHaveTextContent("Log");
    expect(catalog).toHaveTextContent("Do");
    expect(catalog).toHaveTextContent(
      "Nothing is saved without your confirmation."
    );
    expect(
      screen.getByRole("group", { name: "Do suggestions" })
    ).toBeInTheDocument();
  });

  it("should fill the composer with a suggestion without sending it", async () => {
    // Arrange
    const user = userEvent.setup();
    renderConversation([]);

    // Act
    await user.click(screen.getByRole("button", { name: "Log 71.9 kg today" }));

    // Assert
    const composer = screen.getByRole("textbox", { name: "Message" });
    expect(composer).toHaveValue("Log 71.9 kg today");
    expect(composer).toHaveFocus();
    expect(send).not.toHaveBeenCalled();
  });

  it("should add a suggestion without discarding what the user typed", async () => {
    // Arrange
    const user = userEvent.setup();
    renderConversation([]);
    const composer = screen.getByRole("textbox", { name: "Message" });
    await user.type(composer, "My knee hurts.");

    // Act
    await user.click(screen.getByRole("button", { name: "Log 71.9 kg today" }));

    // Assert
    expect(composer).toHaveValue("My knee hurts.\nLog 71.9 kg today");
  });

  it("should send a mid-conversation what-can-I-do follow-up to the model", async () => {
    // Arrange
    const user = userEvent.setup();
    renderConversation([message]);

    // Act
    await user.type(
      screen.getByRole("textbox", { name: "Message" }),
      "What can I do?{Enter}"
    );

    // Assert
    expect(send).toHaveBeenCalledWith("What can I do?");
    expect(screen.queryByTestId("chat-capabilities")).not.toBeInTheDocument();
  });

  it("should answer a typed what-can-you-do question locally", async () => {
    // Arrange
    const user = userEvent.setup();
    renderConversation([message]);

    // Act
    await user.type(
      screen.getByRole("textbox", { name: "Message" }),
      "What can you do?{Enter}"
    );

    // Assert
    expect(screen.getByTestId("chat-capabilities")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Ask about your data/ })
    ).toHaveFocus();
    expect(send).not.toHaveBeenCalled();
  });

  it("should open and close the catalog from the help button", async () => {
    // Arrange
    const user = userEvent.setup();
    renderConversation([message]);

    const trigger = screen.getByRole("button", { name: "What can I do?" });

    // Act
    await user.click(trigger);
    const expanded = trigger.getAttribute("aria-expanded");
    await user.click(screen.getByRole("button", { name: "Close" }));

    // Assert
    expect(expanded).toBe("true");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(screen.queryByTestId("chat-capabilities")).not.toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it("should still send ordinary messages to the model", async () => {
    // Arrange
    const user = userEvent.setup();
    renderConversation([message]);

    // Act
    await user.type(
      screen.getByRole("textbox", { name: "Message" }),
      "How did my week go?{Enter}"
    );

    // Assert
    expect(send).toHaveBeenCalledWith("How did my week go?");
  });
});
