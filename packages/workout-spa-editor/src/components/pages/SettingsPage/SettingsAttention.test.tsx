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

  it("should omit the action on the chip", () => {
    // Arrange
    const attention = {
      title: "1 connection needs attention",
      action: { label: "Fix", onSelect: vi.fn() },
    };

    // Act
    render(<SettingsAttention attention={attention} variant="chip" />);

    // Assert
    expect(screen.getByTestId("settings-attention-chip")).toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-attention-action")
    ).not.toBeInTheDocument();
  });
});
