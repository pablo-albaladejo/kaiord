import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileMenuPanel } from "./MobileMenuPanel";

describe("MobileMenuPanel", () => {
  const defaultProps = {
    activeProfileName: "Pablo",
    libraryCount: 5,
    onProfile: vi.fn(),
    onLibrary: vi.fn(),
    onHelp: vi.fn(),
    onSettings: vi.fn(),
  };

  it("should render all four menu items", () => {
    // Arrange

    // Act

    render(<MobileMenuPanel {...defaultProps} />);

    // Assert

    expect(screen.getByText("Pablo")).toBeInTheDocument();
    expect(screen.getByText("Library (5)")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should show Profiles when activeProfileName is null", () => {
    // Arrange

    // Act

    render(<MobileMenuPanel {...defaultProps} activeProfileName={null} />);

    // Assert

    expect(screen.getByText("Profiles")).toBeInTheDocument();
  });

  it("should call onProfile when profile item is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onProfile = vi.fn();

    render(<MobileMenuPanel {...defaultProps} onProfile={onProfile} />);

    // Act

    await user.click(screen.getByLabelText("Open profile manager"));

    // Assert

    expect(onProfile).toHaveBeenCalledOnce();
  });

  it("should call onLibrary when library item is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onLibrary = vi.fn();

    render(<MobileMenuPanel {...defaultProps} onLibrary={onLibrary} />);

    // Act

    await user.click(screen.getByLabelText("Open workout library"));

    // Assert

    expect(onLibrary).toHaveBeenCalledOnce();
  });

  it("should call onHelp when help item is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onHelp = vi.fn();

    render(<MobileMenuPanel {...defaultProps} onHelp={onHelp} />);

    // Act

    await user.click(screen.getByLabelText("Open help"));

    // Assert

    expect(onHelp).toHaveBeenCalledOnce();
  });

  it("should call onSettings when settings item is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onSettings = vi.fn();

    render(<MobileMenuPanel {...defaultProps} onSettings={onSettings} />);

    // Act

    await user.click(screen.getByLabelText("Open settings"));

    // Assert

    expect(onSettings).toHaveBeenCalledOnce();
  });
});
