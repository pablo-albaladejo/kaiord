import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SettingsRow } from "./SettingsRow";

describe("SettingsRow", () => {
  it("should render an attention dot when the status says so", () => {
    // Arrange

    // Act
    render(
      <SettingsRow
        icon="link"
        label="Connections"
        testId="connections"
        status="attention"
        to="/settings/connections"
        onNavigate={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByTestId("settings-row-connections-attention")
    ).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
  });

  it("should render no attention dot by default", () => {
    // Arrange

    // Act
    render(
      <SettingsRow
        icon="link"
        label="Connections"
        testId="connections"
        to="/settings/connections"
        onNavigate={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.queryByTestId("settings-row-connections-attention")
    ).toBeNull();
    expect(screen.queryByText("Needs attention")).toBeNull();
  });

  it("should render an external destination as a new-tab link", () => {
    // Arrange

    // Act
    render(
      <SettingsRow
        icon="help"
        label="Help & docs"
        testId="helpDocs"
        href="https://kaiord.com/docs/"
      />
    );

    // Assert
    const row = screen.getByTestId("settings-row-helpDocs");
    expect(row).toHaveAttribute("href", "https://kaiord.com/docs/");
    expect(row).toHaveAttribute("target", "_blank");
    expect(row).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should render an action row as a button that runs in place", async () => {
    // Arrange
    const user = userEvent.setup();
    const onActivate = vi.fn();
    render(
      <SettingsRow
        icon="sparkle"
        label="Show tips again"
        testId="replayTips"
        onActivate={onActivate}
      />
    );

    // Act
    await user.click(screen.getByTestId("settings-row-replayTips"));

    // Assert
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("should render a row with neither destination nor action as inert", () => {
    // Arrange

    // Act
    render(<SettingsRow icon="sparkle" label="Inert" testId="inert" />);

    // Assert
    expect(screen.getByTestId("settings-row-inert").tagName).toBe("DIV");
  });
});
