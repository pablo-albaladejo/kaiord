import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SettingsAttention } from "./SettingsAttention";

describe("SettingsAttention", () => {
  it.each([{ variant: "banner" as const }, { variant: "chip" as const }])(
    "should render nothing when the $variant has no attention",
    ({ variant }) => {
      // Arrange

      // Act
      render(<SettingsAttention attention={null} variant={variant} />);

      // Assert
      expect(
        screen.queryByTestId(`settings-attention-${variant}`)
      ).not.toBeInTheDocument();
    }
  );

  it("should render the title and the consequence when attention is given", () => {
    // Arrange
    const attention = {
      title: "WHOOP stopped syncing",
      detail: "Sleep and HRV fell back to Garmin",
    };

    // Act
    render(<SettingsAttention attention={attention} variant="banner" />);

    // Assert
    expect(screen.getByTestId("settings-attention-banner")).toBeInTheDocument();
    expect(screen.getByText(attention.title)).toBeInTheDocument();
    expect(screen.getByText(attention.detail)).toBeInTheDocument();
  });

  it("should run the banner action when it is activated", async () => {
    // Arrange
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <SettingsAttention
        attention={{
          title: "WHOOP stopped syncing",
          action: { label: "Fix", onSelect },
        }}
        variant="banner"
      />
    );

    // Act
    await user.click(screen.getByTestId("settings-attention-action"));

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it.each([{ variant: "banner" as const }, { variant: "chip" as const }])(
    "should announce the $variant when it appears",
    ({ variant }) => {
      // Arrange
      // The surface appears seconds after mount, once the first connection
      // probe answers, so a reader who is not looking at it is only told by
      // the live region.
      const attention = { title: "1 connection needs attention" };

      // Act
      render(<SettingsAttention attention={attention} variant={variant} />);

      // Assert
      const surface = screen.getByTestId(`settings-attention-${variant}`);
      expect(surface).toHaveAttribute("role", "status");
      expect(surface).toHaveAttribute("aria-live", "polite");
    }
  );

  it("should carry the full text of a truncated line in its tooltip", () => {
    // Arrange
    const attention = {
      title: "1 connection needs attention",
      detail:
        "Kaiord cannot read from a source — signing in again may restore it",
    };

    // Act
    render(<SettingsAttention attention={attention} variant="chip" />);

    // Assert
    expect(screen.getByText(attention.detail)).toHaveAttribute(
      "title",
      attention.detail
    );
  });

  it("should run the action from the chip, so the rail is not a dead end", async () => {
    // Arrange
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <SettingsAttention
        attention={{
          title: "1 connection needs attention",
          action: { label: "Open connections", onSelect },
        }}
        variant="chip"
      />
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Open connections" }));

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("should render the chip action as a real link when it has a destination", () => {
    // Arrange
    const attention = {
      title: "1 connection needs attention",
      action: {
        label: "Open connections",
        onSelect: vi.fn(),
        href: "/connections",
      },
    };

    // Act
    render(<SettingsAttention attention={attention} variant="chip" />);

    // Assert
    expect(
      screen.getByRole("link", { name: "Open connections" })
    ).toHaveAttribute("href", "/connections");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
