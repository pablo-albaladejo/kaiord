import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../test-utils";
import { ChatComposer } from "./ChatComposer";

describe("ChatComposer stop control", () => {
  it("should show an enabled Stop button instead of Send while streaming", () => {
    // Arrange
    const onStop = vi.fn();

    // Act
    renderWithProviders(
      <ChatComposer onSend={vi.fn()} disabled streaming onStop={onStop} />
    );

    // Assert
    expect(screen.getByRole("button", { name: "Stop" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
  });

  it("should stop the turn when the Stop button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onStop = vi.fn();
    renderWithProviders(
      <ChatComposer onSend={vi.fn()} disabled streaming onStop={onStop} />
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Stop" }));

    // Assert
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("should stop the turn from the keyboard via Tab and Enter", async () => {
    // Arrange
    const user = userEvent.setup();
    const onStop = vi.fn();
    renderWithProviders(
      <ChatComposer onSend={vi.fn()} disabled streaming onStop={onStop} />
    );

    // Act
    await user.tab();
    await user.keyboard("{Enter}");

    // Assert
    expect(screen.getByRole("button", { name: "Stop" })).toHaveFocus();
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("should show Send and no Stop button when idle", () => {
    // Arrange
    const onStop = vi.fn();

    // Act
    renderWithProviders(
      <ChatComposer onSend={vi.fn()} disabled={false} onStop={onStop} />
    );

    // Assert
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();
  });

  it("should return focus to the input when streaming ends", () => {
    // Arrange
    const { rerender } = renderWithProviders(
      <ChatComposer onSend={vi.fn()} disabled streaming onStop={vi.fn()} />
    );

    // Act
    rerender(<ChatComposer onSend={vi.fn()} disabled={false} />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus();
  });

  it("should not grab focus on an initially enabled mount", () => {
    // Arrange
    const onSend = vi.fn();

    // Act
    renderWithProviders(<ChatComposer onSend={onSend} disabled={false} />);

    // Assert
    expect(screen.getByRole("textbox", { name: "Message" })).not.toHaveFocus();
  });
});
