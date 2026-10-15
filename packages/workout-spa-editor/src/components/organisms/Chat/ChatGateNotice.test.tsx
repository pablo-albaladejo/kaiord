import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { renderWithProviders } from "../../../test-utils";
import { ChatGateNotice } from "./ChatGateNotice";

describe("ChatGateNotice", () => {
  it("should send a user without an athlete to the Athletes page", async () => {
    // Arrange
    const loc = memoryLocation({ path: "/chat", record: true });
    const user = userEvent.setup();
    renderWithProviders(
      <Router hook={loc.hook}>
        <ChatGateNotice kind="noProfile" />
      </Router>
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Create an athlete" }));

    // Assert
    expect(loc.history.at(-1)).toBe("/athletes");
  });
});
