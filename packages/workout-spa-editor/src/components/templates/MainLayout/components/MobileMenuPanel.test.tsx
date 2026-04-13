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

  it("renders all four menu items", () => {
    render(<MobileMenuPanel {...defaultProps} />);

    expect(screen.getByText("Pablo")).toBeInTheDocument();
    expect(screen.getByText("Library (5)")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows Profiles when activeProfileName is null", () => {
    render(<MobileMenuPanel {...defaultProps} activeProfileName={null} />);

    expect(screen.getByText("Profiles")).toBeInTheDocument();
  });

  it("calls onProfile when profile item is clicked", async () => {
    const user = userEvent.setup();
    const onProfile = vi.fn();

    render(<MobileMenuPanel {...defaultProps} onProfile={onProfile} />);

    await user.click(screen.getByLabelText("Open profile manager"));

    expect(onProfile).toHaveBeenCalledOnce();
  });

  it("calls onLibrary when library item is clicked", async () => {
    const user = userEvent.setup();
    const onLibrary = vi.fn();

    render(<MobileMenuPanel {...defaultProps} onLibrary={onLibrary} />);

    await user.click(screen.getByLabelText("Open workout library"));

    expect(onLibrary).toHaveBeenCalledOnce();
  });

  it("calls onHelp when help item is clicked", async () => {
    const user = userEvent.setup();
    const onHelp = vi.fn();

    render(<MobileMenuPanel {...defaultProps} onHelp={onHelp} />);

    await user.click(screen.getByLabelText("Open help"));

    expect(onHelp).toHaveBeenCalledOnce();
  });

  it("calls onSettings when settings item is clicked", async () => {
    const user = userEvent.setup();
    const onSettings = vi.fn();

    render(<MobileMenuPanel {...defaultProps} onSettings={onSettings} />);

    await user.click(screen.getByLabelText("Open settings"));

    expect(onSettings).toHaveBeenCalledOnce();
  });
});
