import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatFab } from "./ChatFab";

const { navigate, state } = vi.hoisted(() => ({
  navigate: vi.fn(),
  state: { location: "/calendar" },
}));

vi.mock("wouter", () => ({
  useLocation: () => [state.location, navigate],
}));

describe("ChatFab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.location = "/calendar";
  });

  it("should navigate to the chat route when clicked", () => {
    // Arrange
    render(<ChatFab />);

    // Act
    screen.getByRole("button", { name: "Open chat assistant" }).click();

    // Assert
    expect(navigate).toHaveBeenCalledWith("/chat");
  });

  it("should not render while already on the chat route", () => {
    // Arrange
    state.location = "/chat";

    // Act
    render(<ChatFab />);

    // Assert
    expect(screen.queryByTestId("chat-fab")).toBeNull();
  });
});
