import { render, screen } from "@testing-library/react";
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

  it("should mark an active row as the current page", () => {
    // Arrange

    // Act
    render(
      <SettingsRow
        icon="link"
        label="Connections"
        testId="connections"
        active
        to="/settings/connections"
        onNavigate={vi.fn()}
      />
    );

    // Assert
    expect(screen.getByTestId("settings-row-connections")).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("should leave a row uncurrent by default", () => {
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
    expect(screen.getByTestId("settings-row-connections")).not.toHaveAttribute(
      "aria-current"
    );
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
});
