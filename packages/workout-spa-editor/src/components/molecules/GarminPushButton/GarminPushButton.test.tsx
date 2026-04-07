import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { GarminPushButton } from "./GarminPushButton";
import { useGarminStore } from "../../../store/garmin-store";

describe("GarminPushButton", () => {
  beforeEach(() => {
    useGarminStore.setState({
      extensionInstalled: false,
      sessionActive: false,
      pushing: { status: "idle" },
      lastError: null,
      lastDetectionTimestamp: null,
    });
  });

  it("renders nothing when extension is not installed", () => {
    const { container } = render(<GarminPushButton />);

    expect(container.innerHTML).toBe("");
  });

  it("shows disabled button when no session", () => {
    useGarminStore.setState({
      extensionInstalled: true,
      sessionActive: false,
    });

    render(<GarminPushButton />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.textContent).toContain("Garmin (no session)");
  });

  it("shows send button when session active", () => {
    useGarminStore.setState({
      extensionInstalled: true,
      sessionActive: true,
    });

    render(<GarminPushButton />);

    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button.textContent).toContain("Send to Garmin");
  });

  it("shows success feedback", () => {
    useGarminStore.setState({
      extensionInstalled: true,
      sessionActive: true,
      pushing: { status: "success" },
    });

    render(<GarminPushButton />);

    expect(screen.getByText("Sent to Garmin")).toBeInTheDocument();
  });

  it("shows error feedback", () => {
    useGarminStore.setState({
      extensionInstalled: true,
      sessionActive: true,
      pushing: { status: "error", message: "Push failed" },
    });

    render(<GarminPushButton />);

    expect(screen.getByText("Push failed")).toBeInTheDocument();
  });
});
